/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD TAB  (v2)
   Removed: clock, weather. Expanded: quiz (60 Qs, daily rotation)
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard',renderDashboard);

async function renderDashboard(container){
  const stats=await getDashboardStats(),o=currentOfficer||{};
  const photo=localStorage.getItem('dio_profile_photo');
  const initials=(o.full_name||'IO').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const avatarHTML=photo?`<img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`:`${initials}`;

  container.innerHTML=`
  <div class="news-ticker-wrap"><span class="news-ticker-text" id="news-ticker">Loading...</span></div>

  <div class="officer-card">
    <div class="officer-card-avatar">${avatarHTML}</div>
    <div style="flex:1;">
      <div class="officer-card-name">${o.full_name||'Officer'}</div>
      <div class="officer-card-meta">
        <span>🏛️ <b>${o.station||'—'}</b></span>
        <span>📍 <b>${o.district||'—'}</b></span>
        <span>🆔 <b>${o.badge_number||'—'}</b></span>
        <span>👮 <b>${o.designation||'IO'}</b></span>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">ENTRUSTED CASES</div>
      <div style="font-size:40px;font-weight:900;color:var(--accent);font-family:var(--font-display);">${stats.total}</div>
    </div>
  </div>

  <!-- ── STATS GRID ─────────────────────────────────────── -->
  <div class="stats-grid" style="grid-template-columns:repeat(7,1fr);gap:8px;">
    <div class="stat-card stat-blue" onclick="showPage('cases',null)" style="padding:10px 6px;" title="Total = sum of all statuses"><div class="stat-num" style="font-size:22px;">${stats.total}</div><div class="stat-label">Entrusted</div></div>
    <div class="stat-card" style="cursor:pointer;padding:10px 6px;" onclick="showPage('cases',null)" title="زیر تفتیش"><div class="stat-num" style="font-size:22px;color:var(--accent);">${stats.under}</div><div class="stat-label">Under Inv.</div></div>
    <div class="stat-card stat-green" onclick="showPage('cases',null)" style="padding:10px 6px;" title="مکمل چالان"><div class="stat-num" style="font-size:22px;">${stats.complete}</div><div class="stat-label">Complete</div></div>
    <div class="stat-card stat-amber" onclick="showPage('cases',null)" style="padding:10px 6px;" title="نامکمل چالان"><div class="stat-num" style="font-size:22px;">${stats.incomplete}</div><div class="stat-label">Incomplete</div></div>
    <div class="stat-card" style="cursor:pointer;padding:10px 6px;" onclick="showPage('cases',null)" title="چالان 512ض ف"><div class="stat-num" style="font-size:22px;color:#06b6d4;">${stats.challan512}</div><div class="stat-label">512 CrPC</div></div>
    <div class="stat-card stat-purple" onclick="showPage('cases',null)" style="padding:10px 6px;" title="عدم پتہ"><div class="stat-num" style="font-size:22px;">${stats.untrace}</div><div class="stat-label">Untraced</div></div>
    <div class="stat-card stat-red" onclick="showPage('cases',null)" style="padding:10px 6px;" title="اخراج"><div class="stat-num" style="font-size:22px;">${stats.cancel}</div><div class="stat-label">Cancelled</div></div>
  </div>

  <!-- ── REMINDERS + MIND-REFRESH ──────────────────────── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;">🔔 Pending Reminders <a onclick="showPage('reminders',null)" style="font-size:10px;cursor:pointer;">View All →</a></div>
      ${stats.reminders.length===0
        ?`<div style="font-size:12px;color:var(--text-muted);padding:10px 0;">✅ No pending reminders</div>`
        :stats.reminders.map(r=>`<div class="reminder-item"><div class="reminder-dot" style="background:${r.priority==='high'?'var(--red)':r.priority==='medium'?'var(--amber)':'var(--accent)'}"></div><div class="reminder-text">${r.text}</div><div class="reminder-date">${formatDate(r.reminder_date)}</div></div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">🧩 Mind-Refresh Tools</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
        <div onclick="openQuiz()" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center;cursor:pointer;"><div style="font-size:24px;margin-bottom:4px;">🧠</div><div style="font-size:10px;color:var(--text-muted);">Legal Quiz</div></div>
        <div onclick="openPuzzle()" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center;cursor:pointer;"><div style="font-size:24px;margin-bottom:4px;">🔢</div><div style="font-size:10px;color:var(--text-muted);">Logic Puzzle</div></div>
        <div onclick="openTimer()" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center;cursor:pointer;"><div style="font-size:24px;margin-bottom:4px;">⏱️</div><div style="font-size:10px;color:var(--text-muted);">Focus Timer</div></div>
      </div>
      <div style="padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:11px;color:var(--text-muted);text-align:center;" id="daily-tip">💡 Loading today's legal tip...</div>
    </div>
  </div>

  <!-- ── RECENT CASES ───────────────────────────────────── -->
  <div class="card">
    <div class="card-title" style="display:flex;justify-content:space-between;">📁 Recent Cases <a onclick="showPage('cases',null)" style="font-size:10px;cursor:pointer;">View All →</a></div>
    ${stats.cases.length===0
      ?`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">No cases yet. <a onclick="showPage('cases',null)" style="cursor:pointer;">Add your first case →</a></div>`
      :`<table class="data-table"><thead><tr><th>FIR No.</th><th>Complainant</th><th>Section</th><th>Status</th><th>Date</th></tr></thead><tbody>
        ${stats.cases.slice(0,5).map(c=>`<tr>
          <td><span class="fir-num" style="cursor:pointer;color:var(--accent);font-weight:700;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number}</span></td>
          <td>${c.complainant||'—'}</td>
          <td style="font-size:11px;color:var(--text-muted);">${c.section_of_law||'—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:11px;color:var(--text-faint);">${formatDate(c.created_at)}</td>
        </tr>`).join('')}
      </tbody></table>`}
  </div>`;

  setTimeout(startNewsTicker,100);
  _setDailyTip();
}

function _setDailyTip(){
  const el=document.getElementById('daily-tip');
  if(!el)return;
  const tips=[
    '💡 Article 10-A: Every person is entitled to a fair trial under the Constitution of Pakistan.',
    '⚖️ Section 154 CrPC: An FIR must be registered without delay for any cognizable offence.',
    '🔒 Article 14: The dignity of man is inviolable. Torture is prohibited by the Constitution.',
    '📋 Section 160 CrPC: Police may summon any person for questioning (Talbi Witness).',
    '⏱️ Section 61 CrPC: An arrested person must be presented before a magistrate within 24 hours.',
    '📜 Section 173 CrPC: Submit challan to court within the prescribed time after investigation.',
    '🛡️ Section 496 CrPC: Bail in a bailable offence is a right, not a favour.',
    '🔍 Section 164 CrPC: Confessions before a magistrate are recorded with full safeguards.',
  ];
  const dayIdx=Math.floor(Date.now()/86400000)%tips.length;
  el.innerHTML=tips[dayIdx];
}

// ── QUIZ (60 Questions — daily rotation) ─────────────────────
const QUIZ_BANK=[
  {q:'Under which section of CrPC is an FIR registered?',opts:['Section 154','Section 155','Section 160'],ans:'A — Section 154 CrPC: Information in cognizable cases',cat:'CrPC'},
  {q:'What is the time limit to produce an arrested person before a magistrate?',opts:['12 hours','24 hours','48 hours'],ans:'B — 24 hours (Article 10 Constitution + Section 61 CrPC)',cat:'Constitution'},
  {q:'Section 302 PPC deals with:',opts:['Attempt to murder','Punishment for Qatl-e-Amd','Culpable homicide'],ans:'B — Section 302 PPC: Punishment for Qatl-e-Amd (murder)',cat:'PPC'},
  {q:'Under which section can police arrest without warrant for a cognizable offence?',opts:['Section 54 CrPC','Section 154 CrPC','Section 161 CrPC'],ans:'A — Section 54 CrPC: Arrest without warrant',cat:'CrPC'},
  {q:'Section 512 CrPC relates to:',opts:['Bail procedures','Challan when accused cannot be found','Warrant execution'],ans:'B — Section 512 CrPC: Report when accused absconding',cat:'CrPC'},
  {q:'Which Article of the Constitution guarantees the right to fair trial?',opts:['Article 9','Article 10','Article 10-A'],ans:'C — Article 10-A: Right to fair trial and due process',cat:'Constitution'},
  {q:'Under which section is a confession before a magistrate recorded?',opts:['Section 161','Section 163','Section 164'],ans:'C — Section 164 CrPC: Recording of confessions and statements',cat:'CrPC'},
  {q:'Section 160 CrPC empowers police to:',opts:['Search without warrant','Summon a person for questioning (Talbi)','Arrest on suspicion'],ans:'B — Section 160 CrPC: Power to require attendance of witnesses',cat:'CrPC'},
  {q:'Maximum period of physical remand under CrPC is:',opts:['7 days','14 days','15 days'],ans:'B — Maximum 14 days physical remand under Section 167 CrPC',cat:'CrPC'},
  {q:'Section 406 PPC deals with:',opts:['Extortion','Criminal breach of trust','Fraud'],ans:'B — Section 406 PPC: Punishment for criminal breach of trust',cat:'PPC'},
  {q:'Section 420 PPC relates to:',opts:['Forgery','Cheating and dishonestly inducing delivery','Criminal breach of trust'],ans:'B — Section 420 PPC: Cheating and dishonestly inducing delivery',cat:'PPC'},
  {q:'Under Section 365 PPC, the offence is:',opts:['Kidnapping for ransom','Kidnapping to wrongfully confine a person','Abduction for marriage'],ans:'B — Section 365 PPC: Kidnapping with intent to wrongfully confine',cat:'PPC'},
  {q:'Section 364-A PPC covers:',opts:['Simple kidnapping','Kidnapping for ransom','Abduction of child'],ans:'B — Section 364-A PPC: Kidnapping for ransom',cat:'PPC'},
  {q:'What does Section 391 PPC define?',opts:['Robbery','Dacoity','Extortion'],ans:'B — Section 391 PPC: Dacoity (5 or more persons commit robbery)',cat:'PPC'},
  {q:'Section 489-F PPC covers:',opts:['Forgery of currency','Dishonoured cheque','Bank fraud'],ans:'B — Section 489-F PPC: Punishment for issuing dishonoured cheque',cat:'PPC'},
  {q:'Bail in a bailable offence is:',opts:['At court discretion','A right of the accused','Only granted by High Court'],ans:'B — Section 496 CrPC: Bail in bailable offences is a right',cat:'CrPC'},
  {q:'Section 497 CrPC deals with:',opts:['Bail in bailable offences','Bail in non-bailable offences','Anticipatory bail'],ans:'B — Section 497: Bail in non-bailable offences',cat:'CrPC'},
  {q:'Section 498 CrPC is commonly known as:',opts:['Judicial remand','Anticipatory bail','Regular bail'],ans:'B — Section 498: Power to grant anticipatory bail by High Court',cat:'CrPC'},
  {q:'Article 9 of the Constitution guarantees:',opts:['Right to education','Security of person','Freedom of speech'],ans:'B — Article 9: Security of person',cat:'Constitution'},
  {q:'Article 14 of the Constitution prohibits:',opts:['Arrest without warrant','Torture and cruel punishment','Double jeopardy'],ans:'B — Article 14: Inviolability of dignity — no torture',cat:'Constitution'},
  {q:'Section 337 PPC deals with:',opts:['Kidnapping','Shajjah — hurt on head/face','Robbery with hurt'],ans:'B — Section 337 PPC: Shajjah',cat:'PPC'},
  {q:'Section 354 PPC covers:',opts:['Robbery','Assault to outrage modesty of woman','Kidnapping'],ans:'B — Section 354 PPC: Assault with criminal force against woman',cat:'PPC'},
  {q:'Maximum punishment under Section 376 PPC (rape) after 2021 amendment:',opts:['10 years','25 years or death','Life imprisonment'],ans:'B — 25 years or death per amended Section 376 PPC',cat:'PPC'},
  {q:'PECA 2016 stands for:',opts:['Pakistan Electronic Crimes Act','Prevention of Electronic Crimes Act','Pakistan Electronic Commerce Act'],ans:'B — Prevention of Electronic Crimes Act 2016',cat:'Cybercrime'},
  {q:'CNSA 1997 controls:',opts:['Cybercrime','Narcotics and drugs','Child trafficking'],ans:'B — Control of Narcotic Substances Act 1997',cat:'CNSA'},
  {q:'Section 9 CNSA 1997 relates to:',opts:['Drug trafficking','Possession of narcotics','Manufacturing narcotics'],ans:'B — Section 9 CNSA: Possession of controlled substances',cat:'CNSA'},
  {q:'Who can award capital punishment (death sentence)?',opts:['Sessions Judge only','Sessions Court (confirmed by High Court)','High Court directly'],ans:'B — Sessions Court awards, High Court must confirm death sentence',cat:'CrPC'},
  {q:'A First Class Magistrate can award maximum imprisonment of:',opts:['3 years','5 years','7 years'],ans:'A — First Class Magistrate: up to 3 years imprisonment',cat:'CrPC'},
  {q:'Section 173 CrPC requires police to submit:',opts:['FIR copy to court','Challan to magistrate on completion','Witness list'],ans:'B — Section 173 CrPC: Final report / challan to court',cat:'CrPC'},
  {q:'Section 22-A CrPC empowers:',opts:['Sessions Judge','Executive Magistrate','Justice of Peace — to direct FIR registration'],ans:'C — Section 22-A: Powers of Justice of Peace',cat:'CrPC'},
  {q:'Anti-Terrorism Act 1997 — minimum sentence for terrorist act:',opts:['7 years','10 years','Death or life imprisonment'],ans:'C — ATA 1997: Death or life imprisonment for terrorist acts',cat:'ATA'},
  {q:'An extra-judicial confession in court:',opts:['Is not admissible','Is admissible but requires corroboration','Is conclusive proof'],ans:'B — Extra-judicial confession needs corroboration',cat:'Evidence'},
  {q:'Dying declaration is admissible under:',opts:['Article 46 QSO','Article 71 QSO','Section 164 CrPC'],ans:'A — Article 46 Qanoon-e-Shahadat 1984',cat:'Evidence'},
  {q:'Section 295-C PPC (Blasphemy) carries punishment of:',opts:['Life imprisonment','Death or life imprisonment','10 years'],ans:'B — Section 295-C: Death or life imprisonment',cat:'PPC'},
  {q:'Under Police Rule 24.1, an officer must maintain:',opts:['Case register','Roznamcha (Daily Diary)','Property register'],ans:'B — Police Rule 24.1: Roznamcha / Daily Diary',cat:'Police Rules'},
  {q:'Judicial remand under Section 167(2) CrPC can be up to:',opts:['30 days','60 days','90 days'],ans:'B — Judicial remand up to 60 days under Section 167(2)',cat:'CrPC'},
  {q:'A cognizable offence is one where police can:',opts:['Only investigate with court order','Arrest without warrant','Issue notice only'],ans:'B — Cognizable offence: arrest without warrant permitted',cat:'CrPC'},
  {q:'Section 307 PPC covers:',opts:['Grievous hurt','Attempt to commit Qatl-e-Amd','Death by negligence'],ans:'B — Section 307 PPC: Attempt to commit Qatl-e-Amd',cat:'PPC'},
  {q:'The maximum punishment for theft under Section 379 PPC is:',opts:['3 years','7 years','10 years'],ans:'A — Section 379 PPC: imprisonment up to 3 years',cat:'PPC'},
  {q:'Section 300 PPC defines:',opts:['Attempt to murder','Murder (Qatl-e-Amd)','Culpable homicide not amounting to murder'],ans:'B — Section 300 PPC: Definition of murder',cat:'PPC'},
  {q:'Section 392 PPC punishment for robbery:',opts:['3 years','Up to 10 years','Life imprisonment'],ans:'B — Section 392: rigorous imprisonment up to 10 years',cat:'PPC'},
  {q:'Anti-Rape Act 2021 prohibits:',opts:['Victim cross-examination','Evidence of victim\'s prior sexual conduct','Both of the above'],ans:'B — Prior sexual history of victim is inadmissible',cat:'Special Laws'},
  {q:'Under which article is double jeopardy prohibited in Pakistan?',opts:['Article 12','Article 13','Article 14'],ans:'B — Article 13: Protection against double punishment',cat:'Constitution'},
  {q:'Section 161 CrPC deals with:',opts:['Recording confessions','Examination of witnesses by police','Search and seizure'],ans:'B — Section 161 CrPC: Examination of witnesses by police',cat:'CrPC'},
  {q:'What is the minimum age for criminal responsibility in Pakistan?',opts:['7 years','10 years','12 years'],ans:'B — 10 years under Juvenile Justice System Act',cat:'Special Laws'},
  {q:'Section 59 CrPC provides for:',opts:['Preventive detention','Arrest by private person for non-bailable offence','Remand'],ans:'B — Section 59: Arrest by private person',cat:'CrPC'},
  {q:'FIR lodged under Section 155 CrPC relates to:',opts:['Cognizable offence','Non-cognizable offence','Both'],ans:'B — Section 155 CrPC: Information as to non-cognizable cases',cat:'CrPC'},
  {q:'Section 295-A PPC deals with:',opts:['Desecration of Quran','Deliberate acts to outrage religious feelings','Blasphemy against Prophet (PBUH)'],ans:'B — Section 295-A: Acts to outrage religious feelings',cat:'PPC'},
  {q:'Section 268 PPC defines:',opts:['Affray','Public nuisance','Assault'],ans:'B — Section 268 PPC: Public nuisance',cat:'PPC'},
  {q:'Hudood Ordinances 1979 relate to:',opts:['Land disputes','Offences against Islamic law (theft, robbery, adultery, false accusation)','Tax evasion'],ans:'B — Hudood Ordinances: Islamic criminal law offences',cat:'Special Laws'},
  {q:'Under Section 167 CrPC, who authorises physical remand?',opts:['SHO','Sessions Judge','Magistrate'],ans:'C — Magistrate authorises physical remand under Section 167',cat:'CrPC'},
  {q:'Section 109 CrPC deals with:',opts:['Preventive detention of suspects','Security for keeping peace','Eviction orders'],ans:'B — Section 109: Security for keeping peace',cat:'CrPC'},
  {q:'The National Accountability Bureau (NAB) operates under:',opts:['NAB Act 1999','Anti-Corruption Act 1947','PPRA Rules'],ans:'A — National Accountability Ordinance (NAO) 1999',cat:'Special Laws'},
  {q:'Section 27 of Qanoon-e-Shahadat deals with:',opts:['Confession to police officer','Confession made before arrest','Information given by accused leading to discovery'],ans:'C — Article 40 QSO: Facts discovered by information from accused',cat:'Evidence'},
  {q:'Which section of PPC covers causing hurt by dangerous weapon?',opts:['Section 324','Section 326','Section 333'],ans:'B — Section 326 PPC: Causing grievous hurt by dangerous weapon',cat:'PPC'},
  {q:'Under which section can a magistrate issue search warrant?',opts:['Section 96 CrPC','Section 98 CrPC','Section 100 CrPC'],ans:'A — Section 96 CrPC: Issue of search warrant',cat:'CrPC'},
  {q:'Section 110 CrPC deals with security for:',opts:['Peace and good behaviour','Habitual offenders','Preventive detention'],ans:'B — Section 110: Security for good behaviour from habitual offenders',cat:'CrPC'},
  {q:'The Juvenile Justice System Act applies to accused persons under age:',opts:['14 years','16 years','18 years'],ans:'C — JJSA 2018: Applies to juveniles under 18 years',cat:'Special Laws'},
  {q:'Under Police Order 2002, the District Police Officer (DPO) is accountable to:',opts:['IG Police','District Government','Federal Government'],ans:'B — DPO accountable to District Government under Police Order 2002',cat:'Police Rules'},
  {q:'Section 342 CrPC provides for:',opts:['Examination of accused by police','Examination of accused by court','Medical examination'],ans:'B — Section 342 CrPC: Power to examine accused by court',cat:'CrPC'},
];

let _quizSession={idx:0,score:0,total:0};

function _getDailyQuestion(){
  // Different question each calendar day; cycles through all questions
  const dayNum=Math.floor(Date.now()/86400000);
  return QUIZ_BANK[dayNum%QUIZ_BANK.length];
}

function openQuiz(){
  // Pick today's question + 4 neighbours for a mini 5-question daily set
  const dayNum=Math.floor(Date.now()/86400000);
  const start=(dayNum*5)%QUIZ_BANK.length;
  const daily=Array.from({length:5},(_,i)=>QUIZ_BANK[(start+i)%QUIZ_BANK.length]);
  _quizSession={idx:0,score:0,total:daily.length,questions:daily};
  _showQuizQuestion();
}

function _showQuizQuestion(){
  const s=_quizSession;
  if(s.idx>=s.total){
    openModal('🧠 Quiz Complete!',
      `<div style="text-align:center;padding:20px;">
        <div style="font-size:48px;margin-bottom:12px;">${s.score===s.total?'🏆':s.score>=3?'🎖️':'📚'}</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent);margin-bottom:8px;">${s.score}/${s.total} Correct</div>
        <div style="font-size:13px;color:var(--text-secondary);">${s.score===s.total?'Perfect score! Excellent legal knowledge.':s.score>=3?'Good job! Keep studying.':'Keep reading the law books — you\'ll improve!'}</div>
      </div>`,
      `<button class="btn btn-primary" onclick="closeModal()">Done</button><button class="btn btn-secondary" onclick="closeModal();openQuiz()">Try Again</button>`);
    return;
  }
  const q=s.questions[s.idx];
  openModal(
    `🧠 Legal Quiz — Q${s.idx+1} of ${s.total} &nbsp;<span style="font-size:10px;color:var(--text-faint);">${q.cat}</span>`,
    `<p style="font-size:14px;font-weight:600;margin-bottom:16px;line-height:1.5;">${q.q}</p>
     <div id="quiz-opts" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
       ${q.opts.map((o,i)=>`<div id="qopt-${i}" onclick="selectQuizOpt(${i})" style="padding:10px 14px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;transition:all 0.15s;">${String.fromCharCode(65+i)}) ${o}</div>`).join('')}
     </div>
     <div id="quiz-answer" style="display:none;padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);">✅ ${q.ans}</div>
     <div style="font-size:10px;color:var(--text-faint);margin-top:8px;">Score: ${s.score}/${s.idx} correct</div>`,
    `<button class="btn btn-secondary" onclick="document.getElementById('quiz-answer').style.display='block'">Reveal Answer</button>
     <button class="btn btn-primary" id="quiz-next-btn" style="display:none;" onclick="closeModal();_quizSession.idx++;_showQuizQuestion()">Next →</button>`);
}

function selectQuizOpt(i){
  const q=_quizSession.questions[_quizSession.idx];
  const correctLetter=q.ans[0]; // 'A', 'B', or 'C'
  const isCorrect=String.fromCharCode(65+i)===correctLetter;
  if(isCorrect)_quizSession.score++;
  // Colour the options
  ['A','B','C'].forEach((_,j)=>{
    const el=document.getElementById(`qopt-${j}`);
    if(!el)return;
    el.style.cursor='default';
    el.onclick=null;
    if(j===i) el.style.background=isCorrect?'var(--green-bg)':'var(--red-bg)';
    if(String.fromCharCode(65+j)===correctLetter) el.style.borderColor='var(--green)';
  });
  document.getElementById('quiz-answer').style.display='block';
  const nb=document.getElementById('quiz-next-btn');
  if(nb)nb.style.display='inline-flex';
}

// ── PUZZLE + TIMER (unchanged) ────────────────────────────────
function openPuzzle(){openModal('🔢 Logic Puzzle',`<p style="font-size:14px;font-weight:600;margin-bottom:12px;">3 Suspects, 1 Crime</p><p style="font-size:13px;color:var(--text-secondary);line-height:1.8;">Ali says: Bilal did it.<br>Bilal says: It was not me.<br>Chand says: I was with Ali.<br><br><em style="color:var(--text-muted);">Only one person is telling the truth.</em><br><br>🔎 Who committed the crime?</p><div id="puzzle-ans" style="display:none;margin-top:12px;padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);">✅ Answer: <b>Ali</b> committed the crime. If Ali is the liar, Bilal did it (matches). But Chand says he was with Ali — if Chand tells truth, Ali has alibi, contradiction. Only if Ali lied and committed the crime do all statements resolve.</div>`,`<button class="btn btn-secondary" onclick="document.getElementById('puzzle-ans').style.display='block'">Reveal Answer</button><button class="btn btn-primary" onclick="closeModal()">Close</button>`);}
let timerInterval=null,timerSeconds=1500;
function openTimer(){openModal('⏱️ Focus Timer',`<div style="text-align:center;"><div style="font-size:64px;font-weight:900;color:var(--accent);font-family:var(--font-mono);" id="timer-disp">25:00</div><div style="display:flex;gap:8px;justify-content:center;margin-top:16px;"><button class="btn btn-primary" onclick="startFocusTimer()">▶ Start</button><button class="btn btn-secondary" onclick="pauseFocusTimer()">⏸ Pause</button><button class="btn btn-secondary" onclick="resetFocusTimer()">↺ Reset</button></div><div style="display:flex;gap:8px;justify-content:center;margin-top:8px;"><button class="btn btn-secondary btn-sm" onclick="setFocusTimer(25)">25 min</button><button class="btn btn-secondary btn-sm" onclick="setFocusTimer(5)">5 min break</button><button class="btn btn-secondary btn-sm" onclick="setFocusTimer(15)">15 min break</button></div></div>`,`<button class="btn btn-secondary" onclick="pauseFocusTimer();closeModal()">Close</button>`);timerSeconds=1500;updateTimerDisplay();}
function updateTimerDisplay(){const el=document.getElementById('timer-disp');if(!el)return;el.textContent=`${Math.floor(timerSeconds/60).toString().padStart(2,'0')}:${(timerSeconds%60).toString().padStart(2,'0')}`;}
function startFocusTimer(){if(timerInterval)return;timerInterval=setInterval(()=>{timerSeconds--;updateTimerDisplay();if(timerSeconds<=0){clearInterval(timerInterval);timerInterval=null;showToast('⏱️ Focus session complete! Take a break.');}},1000);}
function pauseFocusTimer(){clearInterval(timerInterval);timerInterval=null;}
function resetFocusTimer(){pauseFocusTimer();timerSeconds=1500;updateTimerDisplay();}
function setFocusTimer(m){pauseFocusTimer();timerSeconds=m*60;updateTimerDisplay();}
