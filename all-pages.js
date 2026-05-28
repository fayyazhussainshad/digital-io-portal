// ═══════════════════════════════════════════════════
//  DIGITAL IO — SEARCH, LAW, REMINDERS, PERFORMANCE,
//               BACKUP, SETTINGS, ADMIN, MISAL PAGES
// ═══════════════════════════════════════════════════

// ── MISAL BUILDER ──
registerPage('misal', renderMisal);
const MISAL_DOCS = {
  'FIR Documents': ['FIR','FIR Mattan','CRO Form','CDR Form'],
  'Statements': ['Statement 161 CrPC','Statement 164 CrPC','Talbi 160 CrPC','Zimni Androoni','Zimni Berooni'],
  'Court Documents': ['Remand Form','Challan Complete','Challan Incomplete','Challan Repeated','Cancellation Report','Untrace Report'],
  'Identification': ['Shanakht Certificate','Missing Identity Form','Naqsha Moka','Naqsha Baramadgi'],
  'Medical / Forensic': ['Medical Report','Postmortem Report','DNA/PFSA Report','Potency Test'],
  'Judicial Forms': ['High Court Checklist','Forms 25-35A/B/C','Index MISAL','Dockets','Kalandras','Memorandum'],
  'Warrants & Notices': ['Warrant','Ishtihar Application','Abscondence Form','Mafroori Form'],
  'Financial': ['Investigation Bills','Recovery Memo','Saza Slip','RFA Form'],
  'Challan Lists': ['Fehrist Warsan (Death)','Fehrist Gawahan (Challan)','Fehrist Gawahan (Cancellation)'],
  'Intimation': ['Intimation Form','Previous Records'],
};

async function renderMisal(container) {
  const cases = await getCases();
  const officer = currentOfficer || {};

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">📄 MISAL Builder</div>
      <div class="btn-group">
        <select class="filter-select" id="misal-case-select">
          <option value="">— Select Case / FIR —</option>
          ${cases.map(c=>`<option value="${c.id}">${c.fir_number} — ${c.accused_name||'Unknown'}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" onclick="exportMisal('a4')">📤 A4 PDF</button>
        <button class="btn btn-secondary btn-sm" onclick="exportMisal('legal')">📤 Legal PDF</button>
        <button class="btn btn-primary btn-sm" onclick="saveMisalDoc()">💾 Save MISAL</button>
      </div>
    </div>
    <div class="misal-layout">
      <div class="misal-sidebar">
        <div style="padding:10px 14px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--accent);display:flex;justify-content:space-between;">
          <span>Document List</span><span style="color:var(--text-faint);font-weight:400;">Click to add</span>
        </div>
        ${Object.entries(MISAL_DOCS).map(([cat,items])=>`
          <div style="border-bottom:1px solid var(--border-light);">
            <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'" style="padding:8px 14px;font-size:10px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;cursor:pointer;display:flex;justify-content:space-between;">
              <span>${cat}</span><span>▾</span>
            </div>
            <div>
              ${items.map(item=>`
                <div onclick="selectMisalDoc('${item}',this)" style="padding:7px 14px 7px 24px;font-size:12px;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.1s;" onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background=''">
                  <input type="checkbox" style="accent-color:var(--accent);" onclick="event.stopPropagation()"> 📄 ${item}
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="misal-main">
        <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm">📋 Copy</button>
          <button class="btn btn-secondary btn-sm">✂️ Cut</button>
          <button class="btn btn-secondary btn-sm">📌 Paste</button>
          <div style="width:1px;background:var(--border);margin:0 4px;"></div>
          <button class="btn btn-secondary btn-sm">A4</button>
          <button class="btn btn-secondary btn-sm">Legal</button>
          <button class="btn btn-secondary btn-sm">Portrait</button>
          <button class="btn btn-secondary btn-sm">Landscape</button>
        </div>
        <div class="misal-preview">
          <div class="doc-preview" id="fir-doc">
            <div style="text-align:center;margin-bottom:20px;">
              <div style="font-size:12px;color:#555;">حکومت پاکستان — پنجاب پولیس</div>
              <h1 style="font-size:16px;margin-bottom:4px;">FIRST INFORMATION REPORT</h1>
              <div style="font-size:11px;color:#555;">( Under Section 154 Cr.P.C. )</div>
            </div>
            <div style="font-size:11px;color:#888;margin-bottom:8px;text-align:right;font-style:italic;">✏️ Click any field to edit</div>
            <div style="font-size:14px;line-height:1.8;">
              <div style="display:flex;gap:20px;margin:8px 0;">
                <div style="flex:1;"><div style="font-size:11px;color:#777;">FIR No.</div><div class="editable-field" id="pv-fir" contenteditable="true">—</div></div>
                <div style="flex:1;"><div style="font-size:11px;color:#777;">Date</div><div class="editable-field" contenteditable="true">__________</div></div>
                <div style="flex:1;"><div style="font-size:11px;color:#777;">Time</div><div class="editable-field" contenteditable="true">__________</div></div>
              </div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">Police Station</div><div class="editable-field" id="pv-station" contenteditable="true">${officer.station||'__________'}</div></div>
              <div style="display:flex;gap:20px;margin:8px 0;">
                <div style="flex:2;"><div style="font-size:11px;color:#777;">District</div><div class="editable-field" id="pv-district" contenteditable="true">${officer.district||'__________'}</div></div>
                <div style="flex:1;"><div style="font-size:11px;color:#777;">FIR Year</div><div class="editable-field" contenteditable="true">${new Date().getFullYear()}</div></div>
              </div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">Section of Law</div><div class="editable-field" id="pv-section" contenteditable="true">__________</div></div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">Complainant Name</div><div class="editable-field" id="pv-complainant" contenteditable="true">__________________________</div></div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">CNIC No. <span style="font-size:9px;color:#aaa;">Format: 36302-8145493-4</span></div><div class="editable-field" id="pv-cnic" contenteditable="true">_____-_______-_</div></div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">Cell No. <span style="font-size:9px;color:#aaa;">Format: 0300-7339260</span></div><div class="editable-field" id="pv-cell" contenteditable="true">0___-_______</div></div>
              <div style="margin:10px 0;"><div style="font-size:11px;color:#777;">Statement / Occurrence</div><div class="editable-field" contenteditable="true" style="min-height:80px;display:block;"></div></div>
              <div style="display:flex;gap:20px;margin:8px 0;">
                <div style="flex:1;"><div style="font-size:11px;color:#777;">Accused Name</div><div class="editable-field" id="pv-accused" contenteditable="true">__________________________</div></div>
                <div style="flex:1;"><div style="font-size:11px;color:#777;">Offence</div><div class="editable-field" id="pv-offence" contenteditable="true">__________________________</div></div>
              </div>
              <div style="display:flex;gap:20px;margin:8px 0;">
                <div style="flex:1;"><div style="font-size:11px;color:#777;">Investigation Officer</div><div class="editable-field" id="pv-io" contenteditable="true">${officer.full_name||'__________________________'}</div></div>
                <div style="flex:1;"><div style="font-size:11px;color:#777;">SHO</div><div class="editable-field" id="pv-sho" contenteditable="true">__________________________</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('misal-case-select').addEventListener('change', async function() {
    if (!this.value) return;
    const c = await getCase(this.value);
    if (!c) return;
    const set = (id, val) => { const el = document.getElementById(id); if(el && val) el.textContent = val; };
    set('pv-fir', c.fir_number);
    set('pv-section', c.section_of_law);
    set('pv-complainant', c.complainant);
    set('pv-cnic', formatCNIC(c.accused_cnic));
    set('pv-cell', formatCell(c.accused_cell));
    set('pv-accused', c.accused_name);
    set('pv-offence', c.offence_type);
    set('pv-sho', c.sho);
    showToast('📄 Case loaded. All fields are editable — click to modify.', 'success');
  });
}

function selectMisalDoc(name, el) {
  const cb = el.querySelector('input');
  cb.checked = !cb.checked;
  el.style.color = cb.checked ? 'var(--accent)' : 'var(--text-secondary)';
  if (cb.checked) showToast('📄 Added: ' + name);
}

async function saveMisalDoc() {
  const fir = document.getElementById('pv-fir')?.textContent || '—';
  try {
    await saveMisal({ fir_number: fir, document_name: 'FIR', content: document.getElementById('fir-doc')?.innerHTML || '' });
    showToast('💾 MISAL saved for FIR ' + fir, 'success');
  } catch(err) { showToast('❌ Error: ' + err.message, 'error'); }
}

function exportMisal(size) { showToast(`📤 Exporting ${size.toUpperCase()} PDF... Feature will be available in the desktop app version.`, 'info'); }

// ── SEARCH PAGE ──
registerPage('search', renderSearch);
async function renderSearch(container) {
  container.innerHTML = `
    <div class="page-header"><div class="page-title">🔍 Advanced Search & Intelligence</div></div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">SEARCH PARAMETERS</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">FIR Number</label><input class="form-input" id="sr-fir" placeholder="e.g. 245/2025"></div>
        <div class="form-group"><label class="form-label">Accused / Complainant Name</label><input class="form-input" id="sr-name" placeholder="Full or partial name"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">CNIC <span style="color:var(--text-faint);font-size:9px;">36302-8145493-4</span></label><input class="form-input" id="sr-cnic" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)"></div>
        <div class="form-group"><label class="form-label">Cell Number <span style="color:var(--text-faint);font-size:9px;">0300-7339260</span></label><input class="form-input" id="sr-cell" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Section of Law</label><input class="form-input" id="sr-section" placeholder="e.g. 302 PPC"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-input" id="sr-status">
            <option value="">Any Status</option>
            ${Object.entries(STATUS_LABELS).map(([k,v])=>`<option value="${k}">${v} (${k})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="runAdvancedSearch()">🔍 Search</button>
        <button class="btn btn-secondary" onclick="clearSearch()">Clear</button>
        <select class="filter-select" id="sr-sort"><option value="asc">Sort: Ascending</option><option value="desc">Sort: Descending</option></select>
      </div>
    </div>
    <div class="card" id="search-results">
      <div class="card-title">RESULTS</div>
      <div style="color:var(--text-faint);font-size:12px;">Enter criteria above and click Search.</div>
    </div>`;
}

async function runAdvancedSearch() {
  const results = await advancedSearch({
    fir: document.getElementById('sr-fir').value.trim(),
    name: document.getElementById('sr-name').value.trim(),
    cnic: document.getElementById('sr-cnic').value.trim(),
    cell: document.getElementById('sr-cell').value.trim(),
    section: document.getElementById('sr-section').value.trim(),
    status: document.getElementById('sr-status').value,
    sort: document.getElementById('sr-sort').value,
  });

  const el = document.getElementById('search-results');
  if (!el) return;
  if (!results.length) { el.innerHTML = `<div class="card-title">RESULTS</div><div style="color:var(--text-muted);font-size:12px;padding:20px 0;text-align:center;">No cases found matching your criteria.</div>`; return; }

  el.innerHTML = `
    <div class="card-title">RESULTS — ${results.length} case(s) found</div>
    <table class="data-table">
      <thead><tr><th>FIR No.</th><th>Accused</th><th>CNIC</th><th>Cell</th><th>Section</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${results.map(c=>`<tr>
        <td><span class="fir-num" onclick="viewCase('${c.id}')">${c.fir_number}</span></td>
        <td>${c.accused_name||'—'}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${formatCNIC(c.accused_cnic)}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${formatCell(c.accused_cell)}</td>
        <td style="font-size:11px;">${c.section_of_law||'—'}</td>
        <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="viewCase('${c.id}')">View</button></td>
      </tr>`).join('')}</tbody>
    </table>`;
}

function clearSearch() {
  ['sr-fir','sr-name','sr-cnic','sr-cell','sr-section'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('sr-status').value = '';
  const el = document.getElementById('search-results');
  if (el) el.innerHTML = `<div class="card-title">RESULTS</div><div style="color:var(--text-faint);font-size:12px;">Enter criteria above and click Search.</div>`;
}

// ── LAW LIBRARY ──
registerPage('law', renderLaw);
const LAWS = [
  { name:'Pakistan Penal Code', short:'PPC 1860', icon:'⚖️', sections:'511 Sections', color:'#38bdf8', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Code of Criminal Procedure', short:'CrPC 1898', icon:'📜', sections:'565 Sections', color:'#a78bfa', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Motor Vehicle Ordinance', short:'MVO', icon:'🚗', sections:'84 Sections', color:'#22c55e', url:'https://punjabcode.punjab.gov.pk/urdu/index' },
  { name:'Control of Narcotic Substances', short:'CNSA 1997', icon:'💊', sections:'68 Sections', color:'#ef4444', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Arms Ordinance', short:'Arms Ord. 1965', icon:'🔫', sections:'25 Sections', color:'#f59e0b', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Anti-Terrorism Act', short:'ATA 1997', icon:'🛡️', sections:'48 Sections', color:'#f97316', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Women Protection Act', short:'WPA 2006', icon:'👩‍⚖️', sections:'30 Sections', color:'#ec4899', url:'https://punjabcode.punjab.gov.pk/urdu/index' },
  { name:'Qanun-e-Shahadat', short:'Evidence Act 1984', icon:'📋', sections:'166 Articles', color:'#14b8a6', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Anti-Rape Laws', short:'CPLC Act 2021', icon:'⚡', sections:'29 Sections', color:'#6366f1', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Punjab Food Authority Act', short:'PFA 2011', icon:'🍽️', sections:'40 Sections', color:'#84cc16', url:'https://punjabcode.punjab.gov.pk/urdu/index' },
  { name:'Electricity Theft Laws', short:'PECA / Electricity Act', icon:'⚡', sections:'Multiple', color:'#facc15', url:'https://pakistancode.gov.pk/english/index.php' },
  { name:'Prohibition Act', short:'Prohibition Act', icon:'🚫', sections:'18 Sections', color:'#94a3b8', url:'https://pakistancode.gov.pk/english/index.php' },
];

function renderLaw(container) {
  container.innerHTML = `
    <div class="page-header"><div class="page-title">⚖️ Law & Reference Library</div></div>
    <div class="search-bar">
      <input class="search-input" id="law-search" placeholder="Search by law name, section, keyword..." oninput="filterLaws(this.value)">
    </div>
    <div class="btn-group" style="margin-bottom:14px;">
      <button class="btn btn-secondary btn-sm" onclick="window.open('https://punjabcode.punjab.gov.pk/urdu/index')">🔗 Punjab Code (Urdu)</button>
      <button class="btn btn-secondary btn-sm" onclick="window.open('https://pakistancode.gov.pk/english/index.php')">🔗 Pakistan Code</button>
      <button class="btn btn-secondary btn-sm" onclick="window.open('https://data.lhc.gov.pk/dynamic/approved_judgments_result_new.php')">🔗 LHC Judgments</button>
    </div>
    <div class="law-grid" id="law-grid">${renderLawCards(LAWS)}</div>`;
}

function renderLawCards(items) {
  return items.map(l=>`<div class="law-card" onclick="window.open('${l.url}')">
    <div style="font-size:28px;margin-bottom:8px;">${l.icon}</div>
    <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${l.name}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">${l.short}</div>
    <div style="font-size:10px;color:${l.color};">${l.sections}</div>
  </div>`).join('');
}

function filterLaws(q) {
  const s = q.toLowerCase();
  const filtered = s ? LAWS.filter(l=>l.name.toLowerCase().includes(s)||l.short.toLowerCase().includes(s)) : LAWS;
  const grid = document.getElementById('law-grid');
  if (grid) grid.innerHTML = filtered.length ? renderLawCards(filtered) : '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:20px;">No results found.</div>';
}

// ── REMINDERS ──
registerPage('reminders', renderReminders);
async function renderReminders(container) {
  const reminders = await getReminders();
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">🔔 Reminders</div>
      <button class="btn btn-primary" onclick="openAddReminderModal()">+ Add Reminder</button>
    </div>
    <div class="card">
      ${reminders.length === 0
        ? `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:12px;">No reminders. <a onclick="openAddReminderModal()">Add your first reminder →</a></div>`
        : reminders.map(r=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);">
            <input type="checkbox" ${r.is_done?'checked':''} onchange="toggleReminder('${r.id}',this.checked)" style="accent-color:var(--accent);width:16px;height:16px;">
            <div style="flex:1;">
              <div style="font-size:13px;color:var(--text-primary);${r.is_done?'text-decoration:line-through;color:var(--text-muted);':''}">${r.text}</div>
              <div style="font-size:10px;color:var(--text-muted);">${r.linked_fir?'FIR: '+r.linked_fir+' · ':''} ${formatDate(r.reminder_date)}</div>
            </div>
            <span class="pill ${r.priority==='high'?'pill-red':r.priority==='medium'?'pill-amber':'pill-blue'}">${r.priority}</span>
            <button class="btn btn-danger btn-sm" onclick="doDeleteReminder('${r.id}')">✕</button>
          </div>`).join('')}
    </div>`;
}

function openAddReminderModal() {
  openModal('➕ Add Reminder',
    `<div class="form-group"><label class="form-label">Reminder Text *</label><input class="form-input" id="rem-text" placeholder="e.g. Submit challan for FIR 245/2025"></div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="rem-date" type="date"></div>
       <div class="form-group"><label class="form-label">Priority</label>
         <select class="form-input" id="rem-priority"><option value="high">🔴 High</option><option value="medium" selected>🟡 Medium</option><option value="low">🔵 Low</option></select>
       </div>
     </div>
     <div class="form-group"><label class="form-label">Linked FIR (optional)</label><input class="form-input" id="rem-fir" placeholder="e.g. 245/2025"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveReminder()">💾 Save</button>`
  );
}

async function saveReminder() {
  const text = document.getElementById('rem-text').value.trim();
  if (!text) { showToast('⚠️ Reminder text is required.', 'error'); return; }
  try {
    await addReminder({ text, reminder_date: document.getElementById('rem-date').value, priority: document.getElementById('rem-priority').value, linked_fir: document.getElementById('rem-fir').value.trim() });
    closeModal(); showToast('✅ Reminder added!', 'success');
    await updateBadges();
    renderReminders(document.getElementById('page-content'));
  } catch(err) { showToast('❌ Error: ' + err.message, 'error'); }
}

async function toggleReminder(id, done) {
  await updateReminder(id, { is_done: done });
  await updateBadges();
}

async function doDeleteReminder(id) {
  await deleteReminder(id); showToast('🗑️ Reminder deleted.');
  await updateBadges();
  renderReminders(document.getElementById('page-content'));
}

// ── PERFORMANCE ──
registerPage('performance', renderPerformance);
async function renderPerformance(container) {
  const stats = await getDashboardStats();
  const total = stats.total || 1;
  container.innerHTML = `
    <div class="page-header"><div class="page-title">📊 Performance Tracker</div></div>
    <div class="perf-grid">
      ${[
        ['Challan Complete Rate', stats.complete, total, 'var(--green)', '✅'],
        ['Under Investigation', stats.under, total, 'var(--accent)', '🔵'],
        ['Incomplete Challan', stats.incomplete, total, 'var(--amber)', '⚠️'],
        ['Untraced Cases', stats.untrace, total, 'var(--purple)', '🔍'],
        ['Cancelled Cases', stats.cancel, total, 'var(--red)', '❌'],
        ['Pending Reminders', stats.pendingReminders, Math.max(stats.pendingReminders,1), 'var(--amber)', '🔔'],
      ].map(([label,val,denom,color,icon])=>{
        const pct = Math.round((val/denom)*100);
        return `<div class="card">
          <div class="card-title">${icon} ${label}</div>
          <div style="font-size:28px;font-weight:800;color:${color};font-family:var(--font-display);">${val}</div>
          <div class="perf-bar-wrap"><div class="perf-bar" style="width:${pct}%;background:${color};"></div></div>
          <div style="font-size:11px;color:var(--text-muted);">${pct}% of total cases</div>
        </div>`;
      }).join('')}
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title">📈 CASE SUMMARY</div>
      <div class="detail-row"><span class="detail-key">Total Entrusted</span><span class="detail-val" style="color:var(--accent);">${stats.total}</span></div>
      <div class="detail-row"><span class="detail-key">Formula</span><span class="detail-val" style="font-size:10px;color:var(--text-muted);">Complete + Incomplete + Untraced + Cancelled + Under Investigation</span></div>
      <div class="detail-row"><span class="detail-key">Completion Rate</span><span class="detail-val" style="color:var(--green);">${Math.round((stats.complete/total)*100)}%</span></div>
    </div>`;
}

// ── BACKUP PAGE ──
registerPage('backup', renderBackupPage);
function renderBackupPage(container) {
  const status = getBackupStatus();
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">☁️ Backup & Multi-Cloud Sync</div>
      <button class="btn btn-primary" onclick="triggerBackupNow()">🔄 Backup Now</button>
    </div>
    <div class="backup-dest-grid">
      <div class="card">
        <div class="card-title">💾 DEVICE BACKUP</div>
        <div style="text-align:center;padding:10px 0;">
          <div style="font-size:36px;margin-bottom:8px;">💾</div>
          <div style="font-size:12px;font-weight:600;">Local Device</div>
          <div style="font-size:10px;color:var(--green);margin-top:4px;">✅ Always Available Offline</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">Auto-saves every change</div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;" onclick="triggerBackupNow()">💾 Backup Now</button>
        <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px;" onclick="restoreFromLocalBackup()">📂 Restore from Device</button>
      </div>
      <div class="card">
        <div class="card-title">🟢 GOOGLE DRIVE</div>
        ${status.googleDriveConnected
          ? `<div style="font-size:12px;color:var(--green);margin-bottom:8px;">✅ Connected — Real-time sync active</div>
             <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">Syncs within 5 seconds of any change</div>
             <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px;" onclick="disconnectGoogleDrive()">Disconnect</button>`
          : `<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Connect Google Account for automatic real-time cloud backup.</div>
             <button class="btn btn-primary btn-sm" style="width:100%;" onclick="connectGoogleDrive()">🔗 Connect Google Drive</button>`}
      </div>
      <div class="card">
        <div class="card-title">☁️ SUPABASE CLOUD</div>
        <div style="font-size:12px;color:var(--green);margin-bottom:8px;">✅ Active — Data stored securely</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">• Daily automatic backups</div>
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">• AES-256 encryption</div>
        <div style="font-size:10px;color:var(--text-muted);">• Accessible from any device</div>
      </div>
    </div>
    <div class="card" style="background:rgba(34,197,94,0.04);border-color:rgba(34,197,94,0.2);">
      <div class="card-title">♻️ DATA RECOVERY — LOST DEVICE PROTOCOL</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;">
        <b style="color:var(--accent);">1)</b> Install Digital IO on new device · 
        <b style="color:var(--accent);">2)</b> Sign in with your Google account · 
        <b style="color:var(--accent);">3)</b> All cases, evidence, MISAL files and reminders restore automatically · 
        <b style="color:var(--accent);">4)</b> Admin is notified of device change
      </div>
    </div>`;
}

// ── SETTINGS ──
registerPage('settings', renderSettings);
function renderSettings(container) {
  const officer = currentOfficer || {};
  container.innerHTML = `
    <div class="page-header"><div class="page-title">⚙️ Settings & Profile</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card">
        <div class="card-title">👮 OFFICER PROFILE</div>
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="set-name" value="${officer.full_name||''}"></div>
        <div class="form-group"><label class="form-label">Badge / Service Number</label><input class="form-input" id="set-badge" value="${officer.badge_number||''}"></div>
        <div class="form-group"><label class="form-label">Designation</label><input class="form-input" id="set-designation" value="${officer.designation||''}"></div>
        <div class="form-group"><label class="form-label">Police Station</label><input class="form-input" id="set-station" value="${officer.station||''}"></div>
        <div class="form-group"><label class="form-label">District</label><input class="form-input" id="set-district" value="${officer.district||''}"></div>
        <button class="btn btn-primary" onclick="saveProfileSettings()">💾 Save Profile</button>
      </div>
      <div class="card">
        <div class="card-title">🖼️ PROFILE PHOTO</div>
        <div style="text-align:center;padding:16px 0;">
          <div id="settings-avatar" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent-dark),var(--accent));margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;overflow:hidden;font-family:var(--font-display);">
            ${localStorage.getItem('dio_profile_photo') ? `<img src="${localStorage.getItem('dio_profile_photo')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">` : (officer.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()||'IO')}
          </div>
          <button class="btn btn-secondary btn-sm" onclick="changeProfilePhoto()">📷 Change Photo</button>
        </div>
        <div class="card-title" style="margin-top:16px;">🔐 SECURITY</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Your account is protected with MFA. To change your password, sign out and use "Forgot Password".</div>
        <div style="font-size:11px;color:var(--green);">✅ MFA Active · ✅ Audit Logging · ✅ Encrypted Data</div>
      </div>
    </div>`;
}

async function saveProfileSettings() {
  try {
    await updateOfficerProfile({
      full_name: document.getElementById('set-name').value.trim(),
      badge_number: document.getElementById('set-badge').value.trim(),
      designation: document.getElementById('set-designation').value.trim(),
      station: document.getElementById('set-station').value.trim(),
      district: document.getElementById('set-district').value.trim(),
    });
    updateSidebarProfile();
    showToast('✅ Profile updated successfully!', 'success');
  } catch(err) { showToast('❌ Error: ' + err.message, 'error'); }
}

function changeProfilePhoto() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target.result;
      try { localStorage.setItem('dio_profile_photo', src); } catch(err) {}
      document.querySelectorAll('.officer-card-avatar, .sidebar-avatar, #login-avatar, #settings-avatar').forEach(el => {
        el.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`;
      });
      showToast('✅ Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

// ── ADMIN PAGE ──
registerPage('admin', renderAdmin);
async function renderAdmin(container) {
  if (currentRole !== 'admin' && currentRole !== 'superadmin') {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-muted);">⛔ Access Denied. Admin privileges required.</div>`;
    return;
  }
  const stats = await getAdminStats();
  container.innerHTML = `
    <div class="page-header"><div class="page-title">👨‍💼 Admin Control Panel</div></div>
    <div class="admin-stats">
      ${[['Total Officers',stats?.totalOfficers||0,'var(--accent)','👮'],['Total Cases',stats?.totalCases||0,'var(--green)','📁'],['Active Cases',stats?.activeCases||0,'var(--amber)','🔵'],['Completed Cases',stats?.completedCases||0,'var(--green)','✅']].map(([label,val,color,icon])=>`
        <div class="card" style="text-align:center;">
          <div style="font-size:28px;margin-bottom:4px;">${icon}</div>
          <div style="font-size:28px;font-weight:900;color:${color};font-family:var(--font-display);">${val}</div>
          <div style="font-size:11px;color:var(--text-muted);">${label}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">👮 REGISTERED OFFICERS</div>
      <table class="data-table">
        <thead><tr><th>Name</th><th>Station</th><th>District</th><th>Badge</th></tr></thead>
        <tbody>
          ${(stats?.officers||[]).map(o=>`<tr>
            <td style="font-weight:600;">${o.full_name||'—'}</td>
            <td>${o.station||'—'}</td>
            <td>${o.district||'—'}</td>
            <td style="font-family:var(--font-mono);font-size:11px;">${o.badge_number||'—'}</td>
          </tr>`).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No officers registered yet.</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-title">📋 RECENT SYSTEM ACTIVITY</div>
      ${(stats?.recentActivity||[]).slice(0,10).map(log=>`
        <div class="detail-row">
          <span class="detail-key" style="font-family:var(--font-mono);font-size:10px;">${log.action}</span>
          <span class="detail-val" style="font-size:10px;color:var(--text-faint);">${timeAgo(log.created_at)}</span>
        </div>`).join('')||'<div style="color:var(--text-muted);font-size:12px;">No activity logged yet.</div>'}
    </div>`;
}

console.log('✅ All Pages Loaded');
