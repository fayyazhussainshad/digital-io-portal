/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CASES TAB
   Includes: cases list, add/edit modal, case workspace
             (FIR document editor), penal-code picker,
             delete confirmation.
   Loaded after app-core.js.
   ═══════════════════════════════════════════════════════════ */

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
let _casesCache = []; // cached for shareModal lookup without re-fetch
async function renderCases(container,fStatus,fQuery){
  fStatus=fStatus||'';fQuery=fQuery||'';
  const cases=await getCases(fStatus,fQuery);
  _casesCache=cases;
  const o=currentOfficer||{};
  container.innerHTML=`
  <div class="page-header">
    <div><div class="page-title">📁 My Cases</div><div class="page-subtitle">${cases.length} case(s)</div></div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-secondary btn-sm" onclick="openTransferModal()" title="Record a station transfer">🏛️ Station Transfer</button>
      <button class="btn btn-primary" onclick="openAddCaseModal()">+ New Case</button>
    </div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    <input class="search-input" id="case-search" style="flex:1;min-width:200px;" placeholder="🔍 Search FIR No, Complainant, CNIC, Section of Law..." value="${fQuery}" oninput="clearTimeout(window._csTmr);window._csTmr=setTimeout(()=>renderCases(document.getElementById('page-content'),'',this.value),280)">
    <select class="filter-select" id="case-status-filter" onchange="renderCases(document.getElementById('page-content'),this.value,document.getElementById('case-search').value)">
      <option value="" ${!fStatus?'selected':''}>All Statuses</option>
      <option value="under"      ${fStatus==='under'?'selected':''}>زیر تفتیش</option>
      <option value="complete"   ${fStatus==='complete'?'selected':''}>مکمل چالان</option>
      <option value="incomplete" ${fStatus==='incomplete'?'selected':''}>نامکمل چالان</option>
      <option value="challan512" ${fStatus==='challan512'?'selected':''}>چالان 512ض ف</option>
      <option value="untrace"    ${fStatus==='untrace'?'selected':''}>عدم پتہ</option>
      <option value="cancel"     ${fStatus==='cancel'?'selected':''}>اخراج</option>
    </select>
  </div>
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;">
      <table class="data-table" style="width:100%;min-width:1180px;">
        <thead><tr>
          <th style="width:44px;text-align:center;">S/N</th>
          <th>FIR No</th>
          <th>Date of FIR</th>
          <th>Occurrence Date</th>
          <th>Offence</th>
          <th>Police Station</th>
          <th>Complainant</th>
          <th>CNIC</th>
          <th>Cell No</th>
          <th>Status</th>
          <th style="width:130px;text-align:center;">Actions</th>
        </tr></thead>
        <tbody>
          ${cases.length===0
            ?`<tr><td colspan="11" style="text-align:center;padding:48px;color:var(--text-muted);">No cases yet. <a onclick="openAddCaseModal()" style="cursor:pointer;color:var(--accent);">Add your first case →</a></td></tr>`
            :cases.map((c,i)=>renderCaseRow(c,i+1)).join('')}
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
      ${c.is_cross_version?'<br><span style="font-size:9px;color:var(--red);font-weight:600;">⚔️ Cross</span>':''}
    </td>
    <td style="font-size:11px;white-space:nowrap;">${c.fir_date||'—'}</td>
    <td style="font-size:11px;white-space:nowrap;">${c.occurrence_date||'—'}</td>
    <td style="font-size:11px;max-width:150px;">${offence}</td>
    <td style="font-size:11px;">${station}</td>
    <td style="font-size:12px;font-weight:500;">${c.complainant||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${cnic}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${cell}</td>
    <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
    <td>
      <div style="display:flex;gap:2px;justify-content:center;">
        <button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" title="Open Case Form &amp; FIR Documents">📄</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')" title="Edit Case Details">✏️</button>
        <button class="btn btn-primary   btn-sm" onclick="openShareModal('${c.id}')"    title="Share Case via Email or WhatsApp">📤</button>
        <button class="btn btn-danger    btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number||'?'}')" title="Delete Case">🗑️</button>
      </div>
    </td>
  </tr>`;
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
    `تاریخ FIR (Date):     ${c.fir_date||'—'}`,
    `تاریخ وقوعہ (Occ.):  ${c.occurrence_date||'—'}`,
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
     <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
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
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>`);
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

    // FIR + Date
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">FIR Number *</label>'
    + '<input class="form-input" id="cf-fir" value="'+fir+'" placeholder="e.g. 245/2025" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">Date of FIR *</label>'
    + '<input class="form-input" id="cf-date" value="'+date+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" maxlength="10"></div>'
    + '</div>'

    // Occurrence + Status
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Occurrence Date</label>'
    + '<input class="form-input" id="cf-occurrence-date" value="'+occ+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" maxlength="10"></div>'
    + '<div class="form-group"><label class="form-label">Status *</label>'
    + '<select class="form-input" id="cf-status">'+statusOpts+'</select></div>'
    + '</div>'

    // Sections
    + '<div class="form-group">'
    + '<label class="form-label">Sections of Law * <span style="color:var(--text-faint);font-weight:400;">(multiple allowed)</span></label>'
    + '<div style="position:relative;">'
    + '<input class="form-input" id="cf-section-search" placeholder="&#x1F50D; Type section no. or keyword (e.g. 302 or murder)..." oninput="searchPenalCodes(this.value)" autocomplete="off">'
    + '<div id="section-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-card);border:1px solid var(--accent);border-radius:0 0 var(--radius-sm) var(--radius-sm);max-height:180px;overflow-y:auto;z-index:200;box-shadow:var(--shadow);"></div>'
    + '</div>'
    + '<div id="selected-sections" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'+sectionTags+'</div>'
    + '<input type="hidden" id="cf-section" value="'+section+'">'
    + '</div>'

    // Offence
    + '<div class="form-group">'
    + '<label class="form-label">Offence <span style="color:var(--text-faint);font-weight:400;">(auto-filled or type manually)</span></label>'
    + '<input class="form-input" id="cf-offence" value="'+offence+'" placeholder="Auto-filled when section selected" dir="auto">'
    + '</div>'

    // Complainant section
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;">'
    + '<div style="font-size:10px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">&#x1F464; Complainant Details</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Complainant Name *</label>'
    + '<input class="form-input" id="cf-complainant" value="'+complainant+'" placeholder="&#x0645;&#x062F;&#x0639;&#x06CC; &#x06A9;&#x0627; &#x0646;&#x0627;&#x0645; / Complainant Name" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">Complainant CNIC</label>'
    + '<input class="form-input" id="cf-complainant-cnic" value="'+cmpCnic+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Complainant Cell No.</label>'
    + '<input class="form-input" id="cf-complainant-cell" value="'+cmpCell+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)"></div>'
    + '<div class="form-group"><label class="form-label">Complainant Profession</label>'
    + '<input class="form-input" id="cf-complainant-profession" value="'+cmpProf+'" placeholder="&#x067E;&#x06CC;&#x0634;&#x06C1; / Profession" dir="auto"></div>'
    + '</div>'
    + '</div>'

    // FIR Details
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;">'
    + '<div style="font-size:10px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">&#x1F4CB; FIR Details</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">FIR Writer</label>'
    + '<input class="form-input" id="cf-fir-writer" value="'+firWriter+'" placeholder="FIR &#x0644;&#x06A9;&#x06BE;&#x0646;&#x06D2; &#x0648;&#x0627;&#x0644;&#x0627;" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">Complaint Sender</label>'
    + '<input class="form-input" id="cf-complaint-sender" value="'+compSender+'" placeholder="&#x0634;&#x06A9;&#x0627;&#x06CC;&#x062A; &#x0628;&#x06BE;&#x06CC;&#x062C;&#x0646;&#x06D2; &#x0648;&#x0627;&#x0644;&#x0627;" dir="auto"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">SHO</label>'
    + '<input class="form-input" id="cf-sho" value="'+sho+'" placeholder="SHO name" dir="auto"></div>'
    + '<div class="form-group"><label class="form-label">SDPO</label>'
    + '<input class="form-input" id="cf-sdpo" value="'+sdpo+'" placeholder="SDPO name" dir="auto"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label class="form-label">Position</label>'
    + '<select class="form-input" id="cf-position">'+posOpts+'</select></div>'
    + '<div class="form-group"><label class="form-label">Investigation Notes</label>'
    + '<textarea class="form-input" id="cf-notes" placeholder="&#x062A;&#x0641;&#x062A;&#x06CC;&#x0634;&#x06CC; &#x0646;&#x0648;&#x0679;&#x0633;..." dir="auto" style="min-height:60px;resize:vertical;">'+notes+'</textarea></div>'
    + '</div>'
    + '</div>'

    // Document checklist
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:10px;">'
    + '<div style="font-size:10px;color:var(--accent);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">&#x1F4CE; MISAL Documents Required</div>'
    + '<input class="form-input" id="doc-search" placeholder="&#x1F50D; Search documents..." oninput="filterDocChecklist(this.value)" style="margin-bottom:10px;">'
    + '<div style="display:flex;gap:6px;margin-bottom:10px;">'
    + '<input class="form-input" id="custom-doc-input" placeholder="Add custom document..." style="flex:1;">'
    + '<button type="button" class="btn btn-secondary btn-sm" onclick="addCustomDoc()">+ Add</button>'
    + '</div>'
    + '<div id="doc-checklist" style="max-height:220px;overflow-y:auto;">'+docList+'</div>'
    + '</div>'

    // Cross Version
    + '<div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-top:10px;">'
    + '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="toggleCrossVersion()">'
    + '<input type="checkbox" id="cf-cross-version" '+(isCross?'checked':'')+' style="accent-color:var(--red);width:16px;height:16px;" onclick="event.stopPropagation();toggleCrossVersion()">'
    + '<div>'
    + '<div style="font-size:13px;font-weight:700;color:var(--red);">&#x2694;&#xFE0F; Cross Version &#x2014; &#x0645;&#x062E;&#x0627;&#x0644;&#x0641; &#x0645;&#x0642;&#x062F;&#x0645;&#x06C1;</div>'
    + '<div style="font-size:10px;color:var(--text-muted);">Check if accused has also filed a case against complainant for the same incident</div>'
    + '</div>'
    + '</div>'
    + '<div id="cross-version-fields" style="display:'+(isCross?'block':'none')+';margin-top:14px;border-top:1px dashed var(--red);padding-top:14px;">'
    + crossFields
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
    + '<input class="form-input" id="cf-cross-fir-date" value="'+cfd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" maxlength="10"></div>'
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
        <span onclick="event.stopPropagation();removeCustomDoc('${doc.replace(/'/g,"\\'")}');" style="margin-left:auto;color:var(--red);font-size:12px;cursor:pointer;">×</span>
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

  showToast(`✅ Added: ${sectionStr}`, 'success', 1500);
}

function removeSection(sectionStr) {
  selectedSections = selectedSections.filter(s => s !== sectionStr);
  document.getElementById('cf-section').value = selectedSections.join(' + ');
  const container = document.getElementById('selected-sections');
  if (container) container.innerHTML = selectedSections.map(s => sectionTag(s)).join('');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dd = document.getElementById('section-dropdown');
  if (dd && !dd.contains(e.target) && e.target.id !== 'cf-section-search') {
    dd.style.display = 'none';
  }
});

// ── MODAL OPENERS + SAVE/VIEW ──
function openAddCaseModal(){openModal('➕ Add New Case',caseFormHTML(),`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNewCase()">💾 Save Case</button>`);}
async function openEditCaseModal(id){const c=await getCase(id);if(!c)return;openModal(`✏️ Edit — FIR ${c.fir_number}`,caseFormHTML(c),`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEditCase('${id}')">💾 Update</button>`);}
async function saveNewCase(){
  var fir=document.getElementById('cf-fir').value.trim();
  var section=document.getElementById('cf-section').value.trim();
  var complainant=document.getElementById('cf-complainant').value.trim();
  if(!fir||!section||!complainant){showToast('FIR Number, Section and Complainant are required.','error');return;}
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
      offence_type:document.getElementById('cf-offence').value.trim(),
      sho:document.getElementById('cf-sho').value.trim(),
      sdpo:document.getElementById('cf-sdpo').value.trim(),
      status:document.getElementById('cf-status').value,
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
      // Capture station at creation time — survives officer transfers
      case_station:  currentOfficer?.station  || null,
      case_district: currentOfficer?.district || null,
    });
    closeModal();showToast('Case added: FIR '+fir,'success');await updateBadges();renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}
async function saveEditCase(id){
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
      section_of_law:document.getElementById('cf-section').value.trim(),
      offence_type:document.getElementById('cf-offence').value.trim(),
      sho:document.getElementById('cf-sho').value.trim(),
      sdpo:document.getElementById('cf-sdpo').value.trim(),
      status:document.getElementById('cf-status').value,
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
    closeModal();showToast('Case updated!','success');renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
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

async function openCaseWorkspace(id) {
  currentCaseId = id;
  currentDocIndex = null;
  document.getElementById('topbar-title').textContent = '📁 Case Workspace';
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">Opening Case Workspace...</div></div>`;
  const c = await getCase(id);
  if (!c) { showToast('❌ Case not found.', 'error'); return; }
  const docs = c.documents_checklist ? (typeof c.documents_checklist==='string'?JSON.parse(c.documents_checklist):c.documents_checklist) : [];
  const ev = await getEvidence(c.fir_number);
  renderWorkspace(c, docs, ev, container);
}

function renderWorkspace(c, docs, ev, container) {
  const statusColor = {under:'var(--accent)',complete:'var(--green)',incomplete:'var(--amber)',untrace:'var(--purple)',cancel:'var(--red)'}[c.status]||'var(--accent)';
  container.style.padding = '0';
  container.style.overflow = 'hidden';
  container.innerHTML = `
    <!-- WORKSPACE HEADER -->
    <div class="case-header">
      <button class="btn btn-secondary" onclick="goBackToCases()" style="flex-shrink:0;display:flex;align-items:center;gap:6px;font-weight:600;">← My Cases</button>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:18px;font-weight:900;color:var(--accent);font-family:var(--font-mono);">FIR ${c.fir_number}</span>
          <span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span>
          <span style="font-size:12px;color:var(--text-muted);">📅 ${c.fir_date||'—'}</span>
          <span style="font-size:12px;color:var(--text-muted);">⚖️ ${c.section_of_law||'—'}</span>
          <span style="font-size:12px;color:var(--text-muted);">👤 ${c.complainant||'—'}</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')">✏️ Edit Case</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number}')">🗑️</button>
      </div>
    </div>

    <!-- TABS -->
    <div class="case-tabs">
      <div class="case-tab active" id="tab-docs" onclick="switchWorkspaceTab('docs')">📎 Documents (${docs.length})</div>
      <div class="case-tab" id="tab-details" onclick="switchWorkspaceTab('details')">📋 Case Details</div>
      <div class="case-tab" id="tab-evidence" onclick="switchWorkspaceTab('evidence')">🔬 Evidence (${ev.length})</div>
    </div>

    <!-- TAB CONTENT -->
    <div id="workspace-tab-content" style="height:calc(100vh - 200px);overflow:hidden;">
      ${renderDocsTab(c, docs)}
    </div>`;

  // Store for tab switching
  window._workspaceCase = c;
  window._workspaceDocs = docs;
  window._workspaceEv = ev;
}

function switchWorkspaceTab(tab) {
  document.querySelectorAll('.case-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const content = document.getElementById('workspace-tab-content');
  const c = window._workspaceCase;
  const docs = window._workspaceDocs;
  const ev = window._workspaceEv;
  if (tab === 'docs') content.innerHTML = renderDocsTab(c, docs);
  else if (tab === 'details') content.innerHTML = renderDetailsTab(c);
  else if (tab === 'evidence') content.innerHTML = renderEvidenceTab(c, ev);
}

function renderDocsTab(c, docs) {
  if (!docs.length) return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
      <div style="font-size:48px;margin-bottom:12px;">📂</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:6px;">No Documents Selected</div>
      <div style="font-size:12px;margin-bottom:16px;">Edit this case to select required MISAL documents.</div>
      <button class="btn btn-primary" onclick="openEditCaseModal('${c.id}')">✏️ Edit Case & Add Documents</button>
    </div>`;

  return `<div class="workspace-layout">
    <!-- Document Sidebar -->
    <div class="workspace-sidebar">
      <div class="workspace-sidebar-header">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">📎 Case Documents</div>
        <input style="width:100%;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;color:var(--text-primary);font-size:11px;outline:none;" placeholder="🔍 Search documents..." oninput="filterWorkspaceDocs(this.value)">
      </div>
      <div id="workspace-doc-list">
        ${docs.map((doc, i) => `
          <div class="doc-card ${i===currentDocIndex?'active':''}" id="doc-card-${i}" onclick="openDocEditor(${i})">
            <div class="doc-card-icon">📄</div>
            <div class="doc-card-name">${doc}</div>
            <div class="doc-card-status ${docDrafts[currentCaseId+'_'+i]?'doc-status-draft':'doc-status-empty'}">${docDrafts[currentCaseId+'_'+i]?'Draft':'Empty'}</div>
          </div>`).join('')}
      </div>
      <div style="padding:10px;border-top:1px solid var(--border);margin-top:auto;">
        <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="printAllDocs()">🖨️ Print All</button>
      </div>
    </div>

    <!-- Document Editor Area -->
    <div class="workspace-main" id="workspace-editor-area">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">👈</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px;">Select a Document</div>
        <div style="font-size:12px;">Click any document from the left panel to open and edit it.</div>
      </div>
    </div>
  </div>`;
}

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
        <div>۱۔ موبائل فون کال ڈیٹا ریکارڈ صرف FIR یا FIR سے متعلقہ ہونے کی صورت میں فراہم کیا جائے گا یا ایسی انکوائریز جنکا حکم نامہ ہائی کورٹ اور سپریم کورٹ نے دیا ہوں۔</div>
        <div>۲۔ اگر CDR's/IMEI's کا اندراج FIR میں نہ ہو تو ضمنی میں اندراج کریں۔</div>
        <div>۳۔ ضمنی نمبر ${ef('۔۔۔۔۔')} تاریخ ${ef('۔۔۔۔۔')} مرتبہ ${ef('۔۔۔۔۔')} (کاپی ضمنی ہمراہ بھجوائیں یا فارم ہذا کی پشت پر اقتباس ضمنی تحریر کریں)</div>
        <div>۴۔ CDR کے غلط استعمال کی صورت میں ذمہ دار افسر کے خلاف سخت محکمانہ کاروائی کی جائیگی۔</div>
        <div>۵۔ CDR کے ذریعے کیس ٹریس ہونے/ملزمان/اشتہاری پکڑے جانے پر/ریکوری ہونے پر IT آفس (موبائل ٹریکنگ سیل ملتان) کو بھی رپورٹ ارسال کی جائے۔</div>
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
            ۱۔ بل اخراجات ٹرانسپورٹ/ڈیڈ باڈی برائے پوسٹمارٹم<br>
            ۲۔ بل تیاری نقشہ بذریعہ نقشہ نویس<br>
            ۳۔ بل سرالوجسٹ بذریعہ کیمیکل ایگزامینر بذریعہ قبضہ پولیس اشیاء<br>
            ۴۔ بل بلیسٹک ایکسپرٹ کی واردات میں استعمال ہونے والے اسلحہ کی ترسیل<br>
            ۵۔ بل ٹرانسپورٹ برائے گرفتاری ملزمان (عدم دستیابی گاڑی سرکاری)<br>
            ۶۔ بل ٹرانسپورٹ برائے جسمانی ریمانڈ (عدم دستیابی گاڑی سرکاری)<br>
            ۷۔ بل ٹرانسپورٹ برائے اسلحہ<br>
            ۸۔ بل ٹرانسپورٹ برائے برآمدگی چوری شدہ/چھینی گئی گاڑی/کیس پراپرٹی<br>
            ۹۔ بل اندھا قتل نعش کا پوسٹمارٹم/اخراجات کفن دفن<br>
            ۱۰۔ بل ٹرانسپورٹ و میڈیکل برائے زخمی<br>
            ۱۱۔ بل برائے فوٹو گرافی وقوعہ ڈیڈ باڈی<br>
            ۱۲۔ بل برائے ویڈیو فلم غیرقانونی اجتماعات<br>
            ۱۳۔ بل ٹرانسپورٹ برائے شناخت پریڈ<br>
            ۱۴۔ بل اخراجات مشتبہ افراد زیرحراست<br>
            ۱۵۔ بل ٹرانسپورٹ برائے معائنہ انجن/چیسز نمبر/فورنزک سائنس لیبارٹری<br>
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
    <div style="direction:rtl;margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
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
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="card">
        <div class="card-title">📋 FIR Information</div>
        ${[['FIR Number',c.fir_number],['Date of FIR',c.fir_date||'—'],['Occurrence Date',c.occurrence_date||'—'],['Section of Law',c.section_of_law||'—'],['Offence',c.offence_type||'—'],['Status',STATUS_LABELS[c.status]||c.status],['Position',c.position==='court'?'⚖️ In Court':'⏳ Pending'],['FIR Writer',c.fir_writer||'—'],['Complaint Sender',c.complaint_sender||'—'],['SHO',c.sho||'—'],['SDPO',c.sdpo||'—']].map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`).join('')}
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
        ${[
          ['Cross FIR Number', c.cross_fir_number||'—'],
          ['Cross FIR Date', c.cross_fir_date||'—'],
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
  return `<div class="case-tab-content">
    <div class="page-header">
      <div><div style="font-size:16px;font-weight:700;">🔬 Evidence for FIR ${c.fir_number}</div></div>
      <button class="btn btn-primary" onclick="openAddEvidenceModal()">+ Attach Evidence</button>
    </div>
    <div class="evidence-grid">
      ${ev.length===0?`<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;">No evidence attached yet.</div>`:ev.map(e=>`<div class="evidence-card"><div class="evidence-thumb"><span style="font-size:36px;">${e.type==='Photo'?'📷':e.type==='Video'?'🎥':e.type==='Audio'?'🎙️':'📄'}</span></div><div class="evidence-info"><div class="evidence-name">${e.name}</div><div class="evidence-tag">${e.fir_number||'—'}</div><div style="font-size:10px;color:var(--text-faint);margin-top:4px;">${e.type} · ${e.evidence_date||formatDate(e.created_at)}</div></div></div>`).join('')}
    </div>
  </div>`;
}


// ── BACK / DELETE ──
function goBackToCases() {
  const container = document.getElementById('page-content');
  container.style.padding = '20px';
  container.style.overflow = 'auto';
  document.getElementById('topbar-title').textContent = '📁 My Cases';
  renderCases(container);
}
function confirmDeleteCase(id,fir){openModal('🗑️ Confirm Delete',`<p style="color:var(--text-secondary);font-size:13px;">Delete case <b style="color:var(--accent);">FIR ${fir}</b>?<br><br><span style="color:var(--red);font-size:11px;">⚠️ This cannot be undone.</span></p>`,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="closeModal();doDeleteCase('${id}')">🗑️ Delete</button>`);}
async function doDeleteCase(id){try{await deleteCase(id);showToast('🗑️ Case deleted.','info');await updateBadges();renderCases(document.getElementById('page-content'));}catch(err){showToast('❌ Error: '+err.message,'error');}}
