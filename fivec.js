/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — 5-C APPLICATIONS TAB  (v2 — improved editor)
   ═══════════════════════════════════════════════════════════ */

const FIVEC_DESIGNATIONS=['IGP','RPO','CPO','SSP OPS','SSP/INV','DSP','Divisional SP','SP','SHO','Other'];
const FIVEC_STATUS={received:'موصول (Received)',in_progress:'زیر کارروائی (In Progress)',responded:'جواب دیا (Responded)',closed:'بند (Closed)'};
const FIVEC_STATUS_CLS={received:'pill-blue',in_progress:'pill-amber',responded:'pill-green',closed:'pill-purple'};

function esc5C(s){if(s===null||s===undefined)return'';return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ── DATE HELPERS (DD/MM/YYYY ↔ ISO) ──
function toDisplayDate(iso){if(!iso)return'';const p=iso.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:iso;}
function toISODate(dmy){if(!dmy)return null;const p=dmy.split('/');return(p.length===3&&p[2].length===4)?p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):null;}
function autoMaskDate5C(el){let v=el.value.replace(/\D/g,'');if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);if(v.length>5)v=v.slice(0,5)+'/'+v.slice(5,9);el.value=v;}

// ── DB FUNCTIONS ──
async function getApplications5C(query){
  const oid=await getOfficerId();if(!oid)return[];
  const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('officer_id',oid).order('serial_number',{ascending:false});
  if(error){console.error('5C fetch error',error);return[];}
  let list=data||[];
  if(query){const s=query.toLowerCase().trim();list=list.filter(a=>(a.complainant_name||'').toLowerCase().includes(s)||(a.complainant_cnic||'').includes(s)||(a.complainant_cell||'').includes(s)||(a.subject||'').toLowerCase().includes(s)||String(a.serial_number||'').includes(s)||(a.application_5c_numbers||[]).some(n=>(n.application_number||'').toLowerCase().includes(s)||(n.senior_officer_designation||'').toLowerCase().includes(s)||(n.senior_officer_name||'').toLowerCase().includes(s)));}
  return list;
}
async function getApplication5C(id){const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('id',id).single();if(error){console.error(error);return null;}return data;}
async function addApplication5C(d){const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');const{numbers,...main}=d;const{data,error}=await supabaseClient.from('applications_5c').insert({...main,officer_id:oid}).select().single();if(error)throw error;if(numbers&&numbers.length){const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:data.id}));if(rows.length)await supabaseClient.from('application_5c_numbers').insert(rows);}return data;}
async function updateApplication5C(id,d,numbers){const{error}=await supabaseClient.from('applications_5c').update(d).eq('id',id);if(error)throw error;if(numbers!==undefined){await supabaseClient.from('application_5c_numbers').delete().eq('application_5c_id',id);const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));if(rows.length)await supabaseClient.from('application_5c_numbers').insert(rows);}}
async function deleteApplication5C(id){const{data:atts}=await supabaseClient.from('application_5c_attachments').select('storage_path').eq('application_5c_id',id);if(atts&&atts.length)await supabaseClient.storage.from('5c-attachments').remove(atts.map(a=>a.storage_path));const{error}=await supabaseClient.from('applications_5c').delete().eq('id',id);if(error)throw error;}
async function uploadAttachment5C(appId,file,category){if(!currentUser)throw new Error('Not authenticated');const safeName=file.name.replace(/[^\w.\-]/g,'_');const path=`${currentUser.id}/${appId}/${Date.now()}_${safeName}`;const{error:upErr}=await supabaseClient.storage.from('5c-attachments').upload(path,file);if(upErr)throw upErr;const{data,error}=await supabaseClient.from('application_5c_attachments').insert({application_5c_id:appId,file_name:file.name,storage_path:path,file_size:file.size,mime_type:file.type,category}).select().single();if(error){await supabaseClient.storage.from('5c-attachments').remove([path]);throw error;}return data;}
async function getAttachmentUrl5C(path){const{data,error}=await supabaseClient.storage.from('5c-attachments').createSignedUrl(path,3600);if(error){console.error(error);return null;}return data.signedUrl;}
async function deleteAttachment5C(id,path){await supabaseClient.storage.from('5c-attachments').remove([path]);await supabaseClient.from('application_5c_attachments').delete().eq('id',id);}

// ── PAGE RENDERER ──
registerPage('fivec',renderFiveC);
async function renderFiveC(container,query){
  query=query||'';
  const apps=await getApplications5C(query);
  container.innerHTML=`<div class="page-header"><div><div class="page-title">📋 5-C Applications</div><div class="page-subtitle">Applications forwarded by senior officers — track, respond, archive</div></div><button class="btn btn-primary" onclick="open5CForm()">+ New Application</button></div>
  <div class="card" style="margin-bottom:14px;padding:12px;">
    <input class="search-input" id="fivec-search" style="width:100%;" placeholder="🔍 Search by complainant name, CNIC, cell, application number, designation..." value="${esc5C(query)}" oninput="clearTimeout(window._5cTmr);window._5cTmr=setTimeout(()=>renderFiveC(document.getElementById('page-content'),this.value),250)">
    <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">${apps.length} application${apps.length===1?'':'s'} ${query?'matching':'total'}</div>
  </div>
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;"><table class="data-table" style="width:100%;">
      <thead><tr><th>S/N</th><th>Complainant</th><th>CNIC</th><th>Cell</th><th>Application No(s) — Designation</th><th>App Date</th><th>Response Date</th><th>Status</th><th>Files</th><th>Actions</th></tr></thead>
      <tbody>${apps.length===0?`<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">${query?'No matches.':'No applications yet. Click <b>+ New Application</b> to add one.'}</td></tr>`:apps.map(render5CRow).join('')}</tbody>
    </table></div>
  </div>`;
}
function render5CRow(a){
  const nums=(a.application_5c_numbers||[]).map(n=>`<div style="font-size:11px;line-height:1.5;"><b>${esc5C(n.application_number||'')}</b>${n.senior_officer_designation?` <span style="color:var(--text-muted);">— ${esc5C(n.senior_officer_designation)}</span>`:''}</div>`).join('')||'<span style="color:var(--text-muted);">—</span>';
  const att=(a.application_5c_attachments||[]).length;
  return `<tr>
    <td><b>${a.serial_number}</b></td>
    <td>${esc5C(a.complainant_name)||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCNIC(a.complainant_cnic))}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCell(a.complainant_cell))}</td>
    <td>${nums}</td>
    <td style="font-size:11px;">${toDisplayDate(a.application_date)||'—'}</td>
    <td style="font-size:11px;">${toDisplayDate(a.response_date)||'—'}</td>
    <td><span class="pill ${FIVEC_STATUS_CLS[a.status]||'pill-blue'}">${FIVEC_STATUS[a.status]||a.status}</span></td>
    <td style="text-align:center;">📎 ${att}</td>
    <td style="white-space:nowrap;">
      <button class="btn btn-secondary btn-sm" onclick="open5CForm('${a.id}')" title="Edit">✏️</button>
      <button class="btn btn-primary btn-sm" onclick="open5CResponse('${a.id}')" title="Write/View Response">📝</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDelete5C('${a.id}',${a.serial_number})" title="Delete">🗑️</button>
    </td>
  </tr>`;
}

// ── NEW / EDIT FORM ──
async function open5CForm(id){
  let app={complainant_name:'',complainant_cnic:'',complainant_cell:'',application_date:'',response_date:'',subject:'',status:'received',application_5c_numbers:[{}],application_5c_attachments:[]};
  if(id){const fetched=await getApplication5C(id);if(fetched)app=fetched;}
  const nums=(app.application_5c_numbers&&app.application_5c_numbers.length)?app.application_5c_numbers:[{}];
  const inp='width:100%;padding:8px 10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;';
  const lbl='display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;';
  const body=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <div><label style="${lbl}">Complainant Name</label><input style="${inp}" id="f5c-name" value="${esc5C(app.complainant_name)}"></div>
    <div><label style="${lbl}">Complainant CNIC</label><input style="${inp}" id="f5c-cnic" placeholder="36302-1234567-1" value="${esc5C(app.complainant_cnic)}" oninput="autoFormatCNIC(this)"></div>
    <div><label style="${lbl}">Complainant Cell</label><input style="${inp}" id="f5c-cell" placeholder="0300-1234567" value="${esc5C(app.complainant_cell)}" oninput="autoFormatCell(this)"></div>
    <div><label style="${lbl}">Status</label><select style="${inp}" id="f5c-status">${Object.entries(FIVEC_STATUS).map(([k,v])=>`<option value="${k}" ${app.status===k?'selected':''}>${v}</option>`).join('')}</select></div>
    <div><label style="${lbl}">Application Date (DD/MM/YYYY)</label><input style="${inp}" id="f5c-appdate" placeholder="DD/MM/YYYY" value="${toDisplayDate(app.application_date)}" oninput="autoMaskDate5C(this)" maxlength="10"></div>
    <div><label style="${lbl}">Response Date (DD/MM/YYYY)</label><input style="${inp}" id="f5c-respdate" placeholder="DD/MM/YYYY" value="${toDisplayDate(app.response_date)}" oninput="autoMaskDate5C(this)" maxlength="10"></div>
    <div style="grid-column:1/-1;"><label style="${lbl}">Subject / Summary</label><textarea style="${inp};min-height:60px;font-family:inherit;" id="f5c-subject">${esc5C(app.subject)}</textarea></div>
  </div>
  <hr style="margin:18px 0;border:0;border-top:1px solid var(--border);">
  <div style="font-weight:600;margin-bottom:10px;font-size:13px;">📋 Application Numbers <span style="font-weight:400;color:var(--text-muted);font-size:11px;">(each senior officer assigns their own number when forwarding)</span></div>
  <div id="f5c-numbers">${nums.map(render5CNumberRow).join('')}</div>
  <button class="btn btn-secondary btn-sm" type="button" onclick="add5CNumberRow()" style="margin-top:6px;">+ Add Another Number</button>
  ${id?`<hr style="margin:18px 0;border:0;border-top:1px solid var(--border);">
  <div style="font-weight:600;margin-bottom:8px;font-size:13px;">📎 Attachments &amp; Scans</div>
  <div id="f5c-attachments">${(app.application_5c_attachments||[]).map(render5CAttachmentRow).join('')||'<div style="color:var(--text-muted);font-size:12px;padding:8px;">No attachments yet.</div>'}</div>
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','application_scan',this.files[0])"> 📄 Upload Application Scan</label>
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','response_scan',this.files[0])"> 📝 Upload Response Scan</label>
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','attachment',this.files[0])"> 📎 Upload Other</label>
    <label class="btn btn-primary btn-sm" style="cursor:pointer;"><input type="file" accept="image/*" capture="environment" style="display:none;" onchange="upload5CFile('${id}','application_scan',this.files[0])"> 📷 Scan with Camera</label>
  </div>`:`<div style="color:var(--text-muted);font-size:12px;margin-top:14px;padding:10px;background:var(--bg-tertiary);border-radius:6px;">💾 Save the application first, then you can attach files and write a response.</div>`}`;
  const footer=`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="save5CApp('${id||''}')">💾 Save</button>`;
  openModal(`${id?'✏️ Edit':'➕ New'} 5-C Application${id?' #'+app.serial_number:''}`,body,footer);
  // Widen modal so number rows don't scroll horizontally
  setTimeout(()=>{const c=document.querySelector('.modal-card');if(c){c.style.maxWidth='880px';c.style.width='94vw';}},10);
}

function render5CNumberRow(n){
  const inp='padding:7px 9px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:5px;color:var(--text-primary);font-size:12px;width:100%;box-sizing:border-box;';
  const isOther=n.senior_officer_designation==='Other';
  const customVal=isOther?(n.senior_officer_designation_custom||n.senior_officer_name||''):'';
  return `<div class="f5c-num-row" style="background:var(--bg-tertiary);border:1px solid var(--border-light);border-radius:8px;padding:10px;margin-bottom:8px;">
    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px;">
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Application Number</div><input style="${inp}" placeholder="e.g. 1234/IGP/2026" data-field="application_number" value="${esc5C(n.application_number||'')}"></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Senior Officer Designation</div>
        <select style="${inp}" data-field="senior_officer_designation" onchange="handleDesig5C(this)"><option value="">— Select Designation —</option>${FIVEC_DESIGNATIONS.map(d=>`<option value="${d}" ${n.senior_officer_designation===d?'selected':''}>${d}</option>`).join('')}</select>
        <input class="desig-custom" style="${inp};margin-top:6px;display:${isOther?'block':'none'};" placeholder="Enter designation..." data-field="senior_officer_designation_custom" value="${esc5C(customVal)}">
      </div>
      <button class="btn btn-danger btn-sm" type="button" onclick="this.closest('.f5c-num-row').remove()" title="Remove this number" style="margin-bottom:0;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Officer Name (optional)</div><input style="${inp}" placeholder="Officer full name" data-field="senior_officer_name" value="${esc5C(n.senior_officer_name||'')}"></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Forwarded Date (DD/MM/YYYY)</div><input style="${inp}" placeholder="DD/MM/YYYY" data-field="forwarded_date" value="${toDisplayDate(n.forwarded_date)}" oninput="autoMaskDate5C(this)" maxlength="10"></div>
    </div>
  </div>`;
}
function handleDesig5C(sel){
  const custom=sel.closest('.f5c-num-row').querySelector('.desig-custom');
  if(custom){custom.style.display=sel.value==='Other'?'block':'none';if(sel.value!=='Other')custom.value='';}
}
function add5CNumberRow(){
  const c=document.getElementById('f5c-numbers');const tmp=document.createElement('div');tmp.innerHTML=render5CNumberRow({});c.appendChild(tmp.firstElementChild);
}

function render5CAttachmentRow(a){
  const ic=a.category==='application_scan'?'📄':a.category==='response_scan'?'📝':'📎';
  const lb=a.category==='application_scan'?'Application Scan':a.category==='response_scan'?'Response Scan':'Other';
  const sz=a.file_size?` · ${(a.file_size/1024).toFixed(1)}KB`:'';
  return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:6px;">
    <span style="font-size:18px;">${ic}</span>
    <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;">${esc5C(a.file_name)} <span style="color:var(--text-muted);font-size:10px;">(${lb}${sz})</span></span>
    <button class="btn btn-secondary btn-sm" onclick="view5CAttachment('${a.storage_path}')" title="Open/Print">👁️</button>
    <button class="btn btn-danger btn-sm" onclick="delete5CAttachment('${a.id}','${a.storage_path}',this)" title="Delete">🗑️</button>
  </div>`;
}
async function upload5CFile(appId,category,file){if(!file)return;if(file.size>10*1024*1024){showToast('⚠️ File too large (max 10 MB).','error');return;}showToast('⏳ Uploading...','info');try{await uploadAttachment5C(appId,file,category);showToast('✅ Uploaded!','success');open5CForm(appId);}catch(e){showToast('❌ Upload failed: '+e.message,'error',5000);}}
async function view5CAttachment(path){const url=await getAttachmentUrl5C(path);if(url)window.open(url,'_blank');else showToast('❌ Could not get file URL','error');}
async function delete5CAttachment(id,path,btn){if(!confirm('Delete this attachment?'))return;try{await deleteAttachment5C(id,path);if(btn&&btn.closest('div'))btn.closest('div').remove();showToast('🗑️ Deleted','info');}catch(e){showToast('❌ '+e.message,'error');}}

async function save5CApp(id){
  const main={
    complainant_name:document.getElementById('f5c-name').value.trim()||null,
    complainant_cnic:document.getElementById('f5c-cnic').value.trim()||null,
    complainant_cell:document.getElementById('f5c-cell').value.trim()||null,
    application_date:toISODate(document.getElementById('f5c-appdate').value)||null,
    response_date:toISODate(document.getElementById('f5c-respdate').value)||null,
    subject:document.getElementById('f5c-subject').value.trim()||null,
    status:document.getElementById('f5c-status').value,
  };
  const numbers=Array.from(document.querySelectorAll('.f5c-num-row')).map(row=>{
    const r={};
    row.querySelectorAll('[data-field]').forEach(el=>{r[el.dataset.field]=el.value.trim()||null;});
    // If "Other" selected, use the custom text as the designation
    if(r.senior_officer_designation==='Other'){const c=row.querySelector('.desig-custom');r.senior_officer_designation=c&&c.value.trim()?c.value.trim():'Other';}
    // Convert forwarded date
    if(r.forwarded_date)r.forwarded_date=toISODate(r.forwarded_date)||r.forwarded_date;
    delete r.senior_officer_designation_custom;
    return r;
  }).filter(n=>n.application_number);
  try{
    if(id){await updateApplication5C(id,main,numbers);showToast('✅ Updated','success');}
    else{await addApplication5C({...main,numbers});showToast('✅ Application added','success');}
    closeModal();renderFiveC(document.getElementById('page-content'));
  }catch(e){showToast('❌ '+e.message,'error',5000);}
}
function confirmDelete5C(id,sn){if(!confirm(`Delete Application #${sn} and ALL its attachments?`))return;deleteApplication5C(id).then(()=>{showToast('🗑️ Deleted','info');renderFiveC(document.getElementById('page-content'));}).catch(e=>showToast('❌ '+e.message,'error'));}

// ── RESPONSE WRITER (Full-screen Word-like editor) ──
async function open5CResponse(id){
  const app=await getApplication5C(id);if(!app){showToast('❌ Not found','error');return;}
  const o=currentOfficer||{};
  const today=new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'});
  // Only pull application numbers — no officer rank/designation
  const refs=(app.application_5c_numbers||[]).map(n=>esc5C(n.application_number||'')).filter(Boolean).join('، ')||'—';
  const initial=app.response_text||`<div dir="rtl" style="text-align:center;margin-bottom:24px;">
  <div style="font-size:18pt;font-weight:bold;">${esc5C(o.station||'')}، ${esc5C(o.district||'')}</div>
  <div style="font-size:11pt;color:#555;margin-top:6px;">تاریخ: ${today}</div>
</div>
<div dir="rtl" style="margin-bottom:12px;"><b>بسلسلہ (Reference):</b> ${refs}</div>
<div dir="rtl" style="margin-bottom:12px;"><b>درخواست گزار (Complainant):</b> ${esc5C(app.complainant_name||'—')}${app.complainant_cnic?` · CNIC: ${esc5C(formatCNIC(app.complainant_cnic))}`:''}${app.complainant_cell?` · ${esc5C(formatCell(app.complainant_cell))}`:''}</div>
<div dir="rtl" style="margin-bottom:12px;"><b>موضوع (Subject):</b> ${esc5C(app.subject||'—')}</div>
<hr style="margin:18px 0;border:0;border-top:1px solid #bbb;">
<div dir="rtl" style="margin-bottom:8px;"><b>رپورٹ / جواب (Report / Response):</b></div>
<div dir="rtl" style="min-height:300px;">یہاں جواب لکھیں ... / Write your response here ...</div>
<div dir="rtl" style="margin-top:60px;display:flex;justify-content:space-between;">
  <div>دستخط ____________________</div>
  <div style="text-align:right;">${esc5C(o.full_name||'')}</div>
</div>`;

  // Ribbon button style helpers (light theme — Word-like)
  const rb='display:inline-flex;align-items:center;justify-content:center;padding:4px 7px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:13px;color:#333;min-width:28px;height:26px;';
  const sep='width:1px;height:22px;background:#ccc;margin:0 5px;flex-shrink:0;';

  const overlay=document.createElement('div');
  overlay.id='response5c-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(20,20,20,0.95);display:flex;flex-direction:column;';
  overlay.innerHTML=`
  <style>
    .r5btn{${rb}}
    .r5btn:hover{background:#dde4ec;border-color:#b0b8c8;}
    .r5btn:active{background:#c8d4e4;}
    .r5sel{padding:3px 6px;background:white;border:1px solid #ccc;border-radius:3px;font-size:12px;color:#333;height:26px;cursor:pointer;}
    .r5sel:hover{border-color:#888;}
  </style>
  <!-- Title bar -->
  <div style="background:#1a2a3a;padding:8px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #0a1a2a;">
    <span style="font-weight:700;color:#e8f0fe;flex:1;font-size:13px;">📝 Response — App #${app.serial_number} · ${esc5C(app.complainant_name||'')}</span>
    <button class="btn btn-primary btn-sm" onclick="save5CResponse('${id}')" title="Save to database">💾 Save Online</button>
    <button class="btn btn-secondary btn-sm" onclick="downloadResponse5C('${id}','${esc5C((app.complainant_name||'response').replace(/[^\w]/g,'_'))}')" title="Download offline HTML copy">⬇️ Download</button>
    <button class="btn btn-secondary btn-sm" onclick="print5CResponse()" title="Print to paper or PDF">🖨️ Print</button>
    <button class="btn btn-danger btn-sm" onclick="document.getElementById('response5c-overlay').remove()">✕ Close</button>
  </div>
  <!-- Word-like ribbon -->
  <div style="background:#f3f3f3;border-bottom:2px solid #c8c8c8;padding:5px 10px;display:flex;align-items:center;gap:2px;flex-wrap:wrap;">
    <!-- Undo / Redo -->
    <div style="display:flex;align-items:center;gap:1px;">
      <button class="r5btn" onclick="exec5C('undo')" title="Undo (Ctrl+Z)">↩</button>
      <button class="r5btn" onclick="exec5C('redo')" title="Redo (Ctrl+Y)">↪</button>
    </div>
    <div style="${sep}"></div>
    <!-- Font family -->
    <select class="r5sel" id="r5font" onchange="applyFont5C(this.value)" style="min-width:150px;" title="Font family">
      <option value="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">اردو — Jameel Noori</option>
      <option value="'Noto Nastaliq Urdu',serif">Noto Nastaliq Urdu</option>
      <option value="'Arial',sans-serif">Arial</option>
      <option value="'Times New Roman',serif">Times New Roman</option>
      <option value="'Courier New',monospace">Courier New</option>
      <option value="'Aptos','Segoe UI',sans-serif">Aptos / Segoe UI</option>
    </select>
    <!-- Font size -->
    <select class="r5sel" id="r5size" onchange="applyFontSize5C(this.value)" style="width:58px;" title="Font size">
      ${[8,9,10,11,12,13,14,16,18,20,22,24,28,32,36,48].map(s=>`<option value="${s}pt" ${s===14?'selected':''}>${s}</option>`).join('')}
    </select>
    <div style="${sep}"></div>
    <!-- Bold / Italic / Underline / Strikethrough -->
    <div style="display:flex;align-items:center;gap:1px;">
      <button class="r5btn" onclick="exec5C('bold')" title="Bold (Ctrl+B)"><b>B</b></button>
      <button class="r5btn" onclick="exec5C('italic')" title="Italic (Ctrl+I)"><i>I</i></button>
      <button class="r5btn" onclick="exec5C('underline')" title="Underline (Ctrl+U)"><u>U</u></button>
      <button class="r5btn" onclick="exec5C('strikeThrough')" title="Strikethrough"><s>S</s></button>
    </div>
    <div style="${sep}"></div>
    <!-- Text colour -->
    <div style="display:flex;align-items:center;gap:2px;" title="Text colour">
      <label class="r5btn" style="cursor:pointer;" title="Text colour">
        A <input type="color" id="r5color" onchange="exec5C('foreColor');document.execCommand('foreColor',false,this.value)" style="width:18px;height:18px;padding:1px;border:none;cursor:pointer;vertical-align:middle;">
      </label>
    </div>
    <div style="${sep}"></div>
    <!-- Alignment (note: right-aligned first since default is Urdu/RTL) -->
    <div style="display:flex;align-items:center;gap:1px;">
      <button class="r5btn" onclick="exec5C('justifyRight')" title="Align Right (Urdu default)">⬅</button>
      <button class="r5btn" onclick="exec5C('justifyCenter')" title="Centre">⬌</button>
      <button class="r5btn" onclick="exec5C('justifyLeft')" title="Align Left">➡</button>
      <button class="r5btn" onclick="exec5C('justifyFull')" title="Justify">☰</button>
    </div>
    <div style="${sep}"></div>
    <!-- Paragraph direction (per block, not whole doc) -->
    <div style="display:flex;align-items:center;gap:1px;">
      <button class="r5btn" onclick="setParaDir5C('rtl')" title="Set this paragraph to RTL (Urdu)" style="font-size:11px;padding:4px 6px;">← RTL</button>
      <button class="r5btn" onclick="setParaDir5C('ltr')" title="Set this paragraph to LTR (English)" style="font-size:11px;padding:4px 6px;">LTR →</button>
    </div>
    <div style="${sep}"></div>
    <!-- Lists -->
    <div style="display:flex;align-items:center;gap:1px;">
      <button class="r5btn" onclick="exec5C('insertUnorderedList')" title="Bullet list">•≡</button>
      <button class="r5btn" onclick="exec5C('insertOrderedList')" title="Numbered list">1≡</button>
    </div>
  </div>
  <!-- Document area -->
  <div style="flex:1;overflow:auto;padding:28px 20px;background:#525659;">
    <div id="a4-paper" contenteditable="true" spellcheck="false"
      style="background:white;color:#111;width:210mm;min-height:297mm;max-width:100%;margin:0 auto;
             padding:20mm 18mm 20mm 15mm;
             box-shadow:0 4px 24px rgba(0,0,0,0.6);
             font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Aptos','Segoe UI',serif;
             font-size:14pt;line-height:1.9;
             direction:rtl;unicode-bidi:plaintext;
             outline:none;border-radius:1px;
             border-right:2px solid #444;
             border-left:1px solid #777;
             background-image:
               linear-gradient(to left, transparent 0.7cm, #999 0.7cm, #999 calc(0.7cm + 1px), transparent calc(0.7cm + 1px)),
               linear-gradient(to right, transparent 0.5cm, #bbb 0.5cm, #bbb calc(0.5cm + 1px), transparent calc(0.5cm + 1px));
             background-color:white;">${initial}</div>
  </div>`;
  document.body.appendChild(overlay);
  // Focus + attach Arabic numeral interceptor
  setTimeout(()=>{
    const paper=document.getElementById('a4-paper');
    if(paper){
      paper.focus();
      paper.addEventListener('keydown',function(e){
        const map={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
        if(map[e.key]){e.preventDefault();document.execCommand('insertText',false,map[e.key]);}
      });
    }
  },80);
}

// ── EDITOR COMMANDS ──
function exec5C(cmd){document.execCommand(cmd,false,null);}
function applyFont5C(fontVal){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount&&!sel.isCollapsed){
    const span=document.createElement('span');span.style.fontFamily=fontVal;
    span.appendChild(sel.getRangeAt(0).extractContents());
    sel.getRangeAt(0).insertNode(span);
    sel.collapseToEnd();
  }else{const p=document.getElementById('a4-paper');if(p)p.style.fontFamily=fontVal;}
}
function applyFontSize5C(sizeVal){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount&&!sel.isCollapsed){
    const span=document.createElement('span');span.style.fontSize=sizeVal;
    span.appendChild(sel.getRangeAt(0).extractContents());
    sel.getRangeAt(0).insertNode(span);
    sel.collapseToEnd();
  }else{const p=document.getElementById('a4-paper');if(p)p.style.fontSize=sizeVal;}
}
function setParaDir5C(dir){
  const sel=window.getSelection();if(!sel.rangeCount)return;
  let node=sel.getRangeAt(0).commonAncestorContainer;
  if(node.nodeType===3)node=node.parentElement;
  const block=node.closest&&(node.closest('p,div,h1,h2,h3,h4,li,blockquote')||node.closest('#a4-paper'));
  if(block&&block.id!=='a4-paper'){block.setAttribute('dir',dir);block.style.direction=dir;block.style.textAlign=dir==='rtl'?'right':'left';}
  else{document.execCommand('insertHTML',false,`<div dir="${dir}" style="direction:${dir};text-align:${dir==='rtl'?'right':'left'};">​</div>`);}
}

// ── SAVE / DOWNLOAD / PRINT ──
async function save5CResponse(id){
  const html=document.getElementById('a4-paper').innerHTML;
  try{
    await supabaseClient.from('applications_5c').update({response_text:html,response_date:new Date().toISOString().split('T')[0],status:'responded'}).eq('id',id);
    showToast('✅ Response saved online','success');
  }catch(e){showToast('❌ Save failed: '+e.message,'error',5000);}
}
function downloadResponse5C(id,name){
  const html=document.getElementById('a4-paper').innerHTML;
  const full=`<!DOCTYPE html><html lang="ur"><head><meta charset="utf-8"><title>5-C Response — ${name}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:20mm 18mm 20mm 15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:1.9;direction:rtl;margin:0;padding:0;color:#000;border-right:2px solid #444;border-left:1px solid #777;}</style></head><body>${html}</body></html>`;
  const blob=new Blob([full],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`5C_Response_${name}_${id.slice(0,8)}.html`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('⬇️ Offline copy downloaded','success');
}
function print5CResponse(){
  const html=document.getElementById('a4-paper').innerHTML;
  const w=window.open('','_blank','width=900,height=1100');
  if(!w){showToast('⚠️ Allow pop-ups to print','error');return;}
  w.document.write(`<!DOCTYPE html><html lang="ur"><head><meta charset="utf-8"><title>Print Response</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:20mm 18mm 20mm 15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:1.9;direction:rtl;margin:0;color:#000;border-right:2px solid #444;border-left:1px solid #777;}</style></head><body>${html}<scr`+`ipt>window.onload=()=>setTimeout(window.print,400);<\/scr`+`ipt></body></html>`);
  w.document.close();
}
