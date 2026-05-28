// ═══════════════════════════════════════════════════
//  DIGITAL IO — CASES PAGE
// ═══════════════════════════════════════════════════

registerPage('cases', renderCases);

async function renderCases(container, filterStatus = '', filterSearch = '') {
  const cases = await getCases(filterStatus, filterSearch);

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">📁 My Cases</div>
        <div class="page-subtitle">Showing ${cases.length} case(s)</div>
      </div>
      <button class="btn btn-primary" onclick="openAddCaseModal()">+ New Case</button>
    </div>

    <div class="search-bar">
      <input class="search-input" id="case-search" placeholder="🔍 Search by FIR, Name, CNIC, Section..." value="${filterSearch}" oninput="renderCases(document.getElementById('page-content'),'',this.value)">
      <select class="filter-select" id="case-status-filter" onchange="renderCases(document.getElementById('page-content'),this.value,document.getElementById('case-search').value)">
        <option value="" ${!filterStatus?'selected':''}>All Statuses</option>
        <option value="under" ${filterStatus==='under'?'selected':''}>زیر تفتیش (Under Investigation)</option>
        <option value="complete" ${filterStatus==='complete'?'selected':''}>مکمل چالان (Complete)</option>
        <option value="incomplete" ${filterStatus==='incomplete'?'selected':''}>نامکمل چالان (Incomplete)</option>
        <option value="untrace" ${filterStatus==='untrace'?'selected':''}>عدم پتہ (Untraced)</option>
        <option value="cancel" ${filterStatus==='cancel'?'selected':''}>اخراج (Cancelled)</option>
      </select>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr>
          <th>FIR No.</th>
          <th>Accused</th>
          <th>Section</th>
          <th>Offence</th>
          <th>Date</th>
          <th>Status</th>
          <th>Position</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${cases.length === 0
            ? `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px;">
                No cases found. <a onclick="openAddCaseModal()">Add your first case →</a>
               </td></tr>`
            : cases.map(c => `
              <tr>
                <td><span class="fir-num" onclick="viewCase('${c.id}')">${c.fir_number}</span></td>
                <td style="color:var(--text-primary);font-weight:500;">${c.accused_name || '—'}</td>
                <td style="color:var(--text-muted);font-size:11px;font-family:var(--font-mono);">${c.section_of_law || '—'}</td>
                <td style="color:var(--text-muted);font-size:11px;">${c.offence_type || '—'}</td>
                <td style="color:var(--text-faint);font-size:11px;">${c.fir_date || formatDate(c.created_at)}</td>
                <td><span class="pill ${STATUS_CLASSES[c.status] || 'pill-blue'}" style="font-family:'Arial';">${STATUS_LABELS[c.status] || c.status}</span></td>
                <td>
                  <span style="font-size:11px;color:${c.position==='court'?'var(--green)':'var(--amber)'};">
                    ${c.position === 'court' ? '⚖️ In Court' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-secondary btn-sm" onclick="viewCase('${c.id}')">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteCase('${c.id}','${c.fir_number}')">Del</button>
                  </div>
                </td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-faint);text-align:right;">
      Entrusted = Complete + Incomplete + Untraced + Cancelled + Under Investigation
    </div>`;
}

// ── Case Form HTML ──
function caseFormHTML(c = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">FIR Number *</label>
        <input class="form-input" id="cf-fir" value="${c.fir_number||''}" placeholder="e.g. 245/2025">
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" id="cf-date" value="${c.fir_date||''}" placeholder="DD-MM-YYYY">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Accused Name *</label>
        <input class="form-input" id="cf-accused" value="${c.accused_name||''}" placeholder="Full name">
      </div>
      <div class="form-group">
        <label class="form-label">CNIC <span style="color:var(--text-faint);font-size:9px;">36302-8145493-4</span></label>
        <input class="form-input" id="cf-cnic" value="${c.accused_cnic||''}" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Cell Number <span style="color:var(--text-faint);font-size:9px;">0300-7339260</span></label>
        <input class="form-input" id="cf-cell" value="${c.accused_cell||''}" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)">
      </div>
      <div class="form-group">
        <label class="form-label">Complainant</label>
        <input class="form-input" id="cf-complainant" value="${c.complainant||''}" placeholder="Complainant name">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Section of Law *</label>
        <input class="form-input" id="cf-section" value="${c.section_of_law||''}" placeholder="e.g. 302 PPC">
      </div>
      <div class="form-group">
        <label class="form-label">Offence Type</label>
        <input class="form-input" id="cf-offence" value="${c.offence_type||''}" placeholder="e.g. Murder">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">SHO</label>
        <input class="form-input" id="cf-sho" value="${c.sho||''}" placeholder="SHO name">
      </div>
      <div class="form-group">
        <label class="form-label">SDPO</label>
        <input class="form-input" id="cf-sdpo" value="${c.sdpo||''}" placeholder="SDPO name">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Status *</label>
        <select class="form-input" id="cf-status">
          <option value="under" ${(c.status||'under')==='under'?'selected':''}>زیر تفتیش (Under Investigation)</option>
          <option value="complete" ${c.status==='complete'?'selected':''}>مکمل چالان (Complete Challan)</option>
          <option value="incomplete" ${c.status==='incomplete'?'selected':''}>نامکمل چالان (Incomplete Challan)</option>
          <option value="untrace" ${c.status==='untrace'?'selected':''}>عدم پتہ (Untraced)</option>
          <option value="cancel" ${c.status==='cancel'?'selected':''}>اخراج (Cancellation)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Position *</label>
        <select class="form-input" id="cf-position">
          <option value="pending" ${(c.position||'pending')==='pending'?'selected':''}>⏳ Pending</option>
          <option value="court" ${c.position==='court'?'selected':''}>⚖️ In Court</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Investigation Notes</label>
      <textarea class="form-input" id="cf-notes" rows="3" placeholder="Investigation notes, witness info, evidence summary...">${c.notes||''}</textarea>
    </div>`;
}

// ── Add Case Modal ──
function openAddCaseModal() {
  openModal('➕ Add New Case', caseFormHTML(),
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewCase()">💾 Save Case</button>`
  );
}

// ── Edit Case Modal ──
async function openEditCaseModal(id) {
  const c = await getCase(id);
  if (!c) return;
  openModal(`✏️ Edit Case — FIR ${c.fir_number}`, caseFormHTML(c),
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveEditCase('${id}')">💾 Update Case</button>`
  );
}

// ── Save New Case ──
async function saveNewCase() {
  const fir = document.getElementById('cf-fir').value.trim();
  const accused = document.getElementById('cf-accused').value.trim();
  const section = document.getElementById('cf-section').value.trim();

  if (!fir || !accused || !section) {
    showToast('⚠️ FIR Number, Accused Name, and Section are required.', 'error');
    return;
  }

  try {
    await addCase({
      fir_number: fir,
      fir_date: document.getElementById('cf-date').value.trim(),
      accused_name: accused,
      accused_cnic: document.getElementById('cf-cnic').value.trim(),
      accused_cell: document.getElementById('cf-cell').value.trim(),
      complainant: document.getElementById('cf-complainant').value.trim(),
      section_of_law: section,
      offence_type: document.getElementById('cf-offence').value.trim(),
      sho: document.getElementById('cf-sho').value.trim(),
      sdpo: document.getElementById('cf-sdpo').value.trim(),
      status: document.getElementById('cf-status').value,
      position: document.getElementById('cf-position').value,
      notes: document.getElementById('cf-notes').value.trim(),
    });
    closeModal();
    showToast(`✅ Case added: FIR ${fir}`, 'success');
    await updateBadges();
    renderCases(document.getElementById('page-content'));
  } catch (err) {
    showToast('❌ Error saving case: ' + err.message, 'error');
  }
}

// ── Save Edit Case ──
async function saveEditCase(id) {
  try {
    const fir = document.getElementById('cf-fir').value.trim();
    await updateCase(id, {
      fir_number: fir,
      fir_date: document.getElementById('cf-date').value.trim(),
      accused_name: document.getElementById('cf-accused').value.trim(),
      accused_cnic: document.getElementById('cf-cnic').value.trim(),
      accused_cell: document.getElementById('cf-cell').value.trim(),
      complainant: document.getElementById('cf-complainant').value.trim(),
      section_of_law: document.getElementById('cf-section').value.trim(),
      offence_type: document.getElementById('cf-offence').value.trim(),
      sho: document.getElementById('cf-sho').value.trim(),
      sdpo: document.getElementById('cf-sdpo').value.trim(),
      status: document.getElementById('cf-status').value,
      position: document.getElementById('cf-position').value,
      notes: document.getElementById('cf-notes').value.trim(),
    });
    closeModal();
    showToast(`✅ Case updated: FIR ${fir}`, 'success');
    renderCases(document.getElementById('page-content'));
  } catch (err) {
    showToast('❌ Error updating case: ' + err.message, 'error');
  }
}

// ── View Case ──
async function viewCase(id) {
  const c = await getCase(id);
  if (!c) return;
  const evidence = await getEvidence(c.fir_number);

  const evidenceHTML = evidence.length === 0
    ? `<div style="font-size:11px;color:var(--text-faint);padding:8px 0;">No evidence attached for this FIR.</div>`
    : evidence.map(e => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border-light);">
          <span style="font-size:20px;">${e.icon||'📄'}</span>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">${e.name}</div>
            <div style="font-size:10px;color:var(--text-muted);">${e.type} · ${e.evidence_date||'—'}</div>
          </div>
          <span style="font-size:9px;background:var(--hover-bg);color:var(--text-muted);padding:2px 6px;border-radius:4px;">🔒 Read-only</span>
        </div>`).join('');

  openModal(`📋 Case Details — FIR ${c.fir_number}`,
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
      ${[
        ['FIR Number', c.fir_number],
        ['Date', c.fir_date || '—'],
        ['Accused', c.accused_name || '—'],
        ['CNIC', formatCNIC(c.accused_cnic)],
        ['Cell', formatCell(c.accused_cell)],
        ['Complainant', c.complainant || '—'],
        ['Section', c.section_of_law || '—'],
        ['Offence', c.offence_type || '—'],
        ['SHO', c.sho || '—'],
        ['SDPO', c.sdpo || '—'],
        ['Status', STATUS_LABELS[c.status] || c.status],
        ['Position', c.position === 'court' ? '⚖️ In Court' : '⏳ Pending'],
      ].map(([k,v]) => `
        <div class="detail-row">
          <span class="detail-key">${k}</span>
          <span class="detail-val">${v}</span>
        </div>`).join('')}
    </div>
    ${c.notes ? `<div style="margin-top:12px;padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:12px;color:var(--text-secondary);"><b style="color:var(--accent);">Notes:</b><br>${c.notes}</div>` : ''}
    <div style="margin-top:16px;">
      <div style="font-size:10px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">📎 Attached Evidence (${evidence.length})</div>
      <div style="max-height:160px;overflow-y:auto;background:var(--bg-tertiary);border-radius:8px;padding:6px 12px;">
        ${evidenceHTML}
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>
     <button class="btn btn-secondary" onclick="closeModal();showPage('evidence',null)">🔬 Evidence</button>
     <button class="btn btn-primary" onclick="closeModal();openEditCaseModal('${id}')">✏️ Edit</button>`
  );
}

// ── Delete Case ──
function confirmDeleteCase(id, firNum) {
  openModal('🗑️ Confirm Delete',
    `<p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">
      Delete case <b style="color:var(--accent);">FIR ${firNum}</b>?<br><br>
      <span style="color:var(--red);font-size:11px;">⚠️ This action cannot be undone. All related data will be permanently removed.</span>
    </p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="closeModal();doDeleteCase('${id}')">🗑️ Delete Permanently</button>`
  );
}

async function doDeleteCase(id) {
  try {
    await deleteCase(id);
    showToast('🗑️ Case deleted successfully.', 'info');
    await updateBadges();
    renderCases(document.getElementById('page-content'));
  } catch (err) {
    showToast('❌ Error deleting case: ' + err.message, 'error');
  }
}

console.log('✅ Cases Page Loaded');
