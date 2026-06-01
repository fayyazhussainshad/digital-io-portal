/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ADVANCED SEARCH TAB  (v2)
   Searches across: FIR No · Complainant · CNIC · Cell ·
   Section of Law · Status · Date Range
   ═══════════════════════════════════════════════════════════ */

registerPage('search',renderSearch);

function renderSearch(container){
  const inp='width:100%;padding:8px 10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;';
  const lbl='display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;';
  const fg='margin-bottom:0;';

  container.innerHTML=`
  <div class="page-header">
    <div><div class="page-title">🔍 Advanced Search</div>
    <div class="page-subtitle">Search across all case fields simultaneously</div></div>
  </div>

  <div class="card" style="margin-bottom:16px;">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
      <div style="${fg}"><label style="${lbl}">FIR Number</label><input style="${inp}" id="sr-fir" placeholder="e.g. 252/26" oninput="liveSearch()"></div>
      <div style="${fg}"><label style="${lbl}">Complainant / Accused Name</label><input style="${inp}" id="sr-name" placeholder="Full or partial name" oninput="liveSearch()"></div>
      <div style="${fg}"><label style="${lbl}">CNIC</label><input style="${inp}" id="sr-cnic" placeholder="e.g. 36302-1234567-1" oninput="liveSearch()"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
      <div style="${fg}"><label style="${lbl}">Cell Number</label><input style="${inp}" id="sr-cell" placeholder="e.g. 0300-1234567" oninput="liveSearch()"></div>
      <div style="${fg}"><label style="${lbl}">Section of Law / Offence</label><input style="${inp}" id="sr-section" placeholder="e.g. 302 PPC, kidnapping" oninput="liveSearch()"></div>
      <div style="${fg}"><label style="${lbl}">Case Status</label>
        <select style="${inp}" id="sr-status" onchange="liveSearch()">
          <option value="">Any Status</option>
          ${Object.entries(STATUS_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:12px;align-items:end;">
      <div style="${fg}"><label style="${lbl}">FIR Date From</label><input style="${inp}" type="date" id="sr-from" onchange="liveSearch()"></div>
      <div style="${fg}"><label style="${lbl}">FIR Date To</label><input style="${inp}" type="date" id="sr-to" onchange="liveSearch()"></div>
      <button class="btn btn-primary" onclick="runAdvancedSearch()">🔍 Search</button>
      <button class="btn btn-secondary" onclick="clearSearch()">✕ Clear</button>
    </div>
  </div>

  <div class="card" id="search-results">
    <div style="text-align:center;padding:32px;color:var(--text-faint);font-size:13px;">
      🔍 Enter any criteria above — results appear instantly
    </div>
  </div>`;
}

let _searchTimer=null;
function liveSearch(){
  clearTimeout(_searchTimer);
  _searchTimer=setTimeout(runAdvancedSearch,300);
}

async function runAdvancedSearch(){
  const fir    =document.getElementById('sr-fir')?.value.trim()||'';
  const name   =document.getElementById('sr-name')?.value.trim()||'';
  const cnic   =document.getElementById('sr-cnic')?.value.trim()||'';
  const cell   =document.getElementById('sr-cell')?.value.trim()||'';
  const section=document.getElementById('sr-section')?.value.trim()||'';
  const status =document.getElementById('sr-status')?.value||'';
  const from   =document.getElementById('sr-from')?.value||'';
  const to     =document.getElementById('sr-to')?.value||'';

  // Don't search if all fields are empty
  if(!fir&&!name&&!cnic&&!cell&&!section&&!status&&!from&&!to) return;

  const el=document.getElementById('search-results');
  if(!el)return;
  el.innerHTML=`<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">🔍 Searching...</div>`;

  const results=await advancedSearch({fir,name,cnic,cell,section,status,date_from:from,date_to:to});

  if(!results.length){
    el.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:32px;margin-bottom:8px;">🔍</div>
      <div style="font-weight:600;">No cases found</div>
      <div style="font-size:12px;margin-top:4px;">Try different search terms</div>
    </div>`;
    return;
  }

  el.innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-weight:700;font-size:14px;">📋 ${results.length} case${results.length!==1?'s':''} found</div>
  </div>
  <div style="overflow-x:auto;">
  <table class="data-table" style="width:100%;min-width:900px;">
    <thead><tr>
      <th>FIR No.</th>
      <th>Complainant</th>
      <th>CNIC</th>
      <th>Cell No.</th>
      <th>Section / Offence</th>
      <th>Station</th>
      <th>Status</th>
      <th>FIR Date</th>
      <th>Action</th>
    </tr></thead>
    <tbody>
      ${results.map(c=>`<tr>
        <td><span style="font-family:var(--font-mono);font-weight:800;color:var(--accent);font-size:12px;cursor:pointer;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</span></td>
        <td style="font-size:12px;">${c.complainant||'—'}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${formatCNIC(c.complainant_cnic)||'—'}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${formatCell(c.complainant_cell)||'—'}</td>
        <td style="font-size:11px;max-width:150px;">${[c.section_of_law,c.offence_type].filter(Boolean).join(' / ')||'—'}</td>
        <td style="font-size:11px;">${c.case_station||'—'}</td>
        <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
        <td style="font-size:11px;white-space:nowrap;">${c.fir_date||'—'}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" title="Open Case">📄</button>
          <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')" title="Edit Case">✏️</button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
  </div>`;
}

function clearSearch(){
  ['sr-fir','sr-name','sr-cnic','sr-cell','sr-section','sr-from','sr-to'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  const st=document.getElementById('sr-status');if(st)st.value='';
  const el=document.getElementById('search-results');
  if(el)el.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text-faint);font-size:13px;">🔍 Enter any criteria above — results appear instantly</div>`;
}
