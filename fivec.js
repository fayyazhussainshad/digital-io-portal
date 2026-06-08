/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — 5-C APPLICATIONS TAB  (v3 — editor fixes)
   ═══════════════════════════════════════════════════════════ */

const FIVEC_DESIGNATIONS=['IGP','RPO','CPO','SSP OPS','SSP/INV','DSP','Divisional SP','SP','SHO','Other'];
const FIVEC_STATUS={received:'موصول (Received)',in_progress:'زیر کارروائی (In Progress)',responded:'جواب دیا (Responded)',closed:'بند (Closed)'};
const FIVEC_STATUS_CLS={received:'pill-blue',in_progress:'pill-amber',responded:'pill-green',closed:'pill-purple'};

function esc5C(s){if(s===null||s===undefined)return'';return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ── DATE HELPERS ──
function toDisplayDate(iso){if(!iso)return'';const p=iso.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:iso;}
function toISODate(dmy){if(!dmy)return null;const p=dmy.split('/');return(p.length===3&&p[2].length===4)?p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):null;}
function autoMaskDate5C(el){let v=el.value.replace(/\D/g,'');if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);if(v.length>5)v=v.slice(0,5)+'/'+v.slice(5,9);el.value=v;}

// ── DB FUNCTIONS ──
async function getApplications5C(query){
  const oid=await getOfficerId();if(!oid)return[];
  try{
    if(!navigator.onLine)throw new Error('offline');
    const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('officer_id',oid).order('serial_number',{ascending:false});
    if(error)throw error;
    const list=data||[];
    // cache without attachments blobs for storage efficiency
    offlineStore.cache('fivec_cache',list).catch(()=>{});
    if(query){const s=query.toLowerCase().trim();return list.filter(a=>(a.complainant_name||'').toLowerCase().includes(s)||(a.complainant_cnic||'').includes(s)||(a.complainant_cell||'').includes(s)||(a.subject||'').toLowerCase().includes(s)||String(a.serial_number||'').includes(s)||(a.application_5c_numbers||[]).some(n=>(n.application_number||'').toLowerCase().includes(s)||(n.senior_officer_designation||'').toLowerCase().includes(s)||(n.senior_officer_name||'').toLowerCase().includes(s)));}
    return list;
  }catch(_){
    let list=await offlineStore.getAll('fivec_cache',oid);
    if(query){const s=query.toLowerCase().trim();list=list.filter(a=>(a.complainant_name||'').toLowerCase().includes(s)||String(a.serial_number||'').includes(s)||(a.application_5c_numbers||[]).some(n=>(n.application_number||'').toLowerCase().includes(s)));}
    return list;
  }
}
async function getApplication5C(id){const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('id',id).single();if(error){console.error(error);return null;}return data;}
async function addApplication5C(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  if(!navigator.onLine){
    const tempId='offline_5c_'+Date.now();
    const local={...d,id:tempId,officer_id:oid,created_at:new Date().toISOString(),_offline:true};
    await offlineStore.cache('fivec_cache',local);
    await offlineStore.enqueue('fivec','insert',{...d,officer_id:oid},tempId);
    _showSyncBar('pending','📴 5-C application saved offline — will sync when connected');
    return local;
  }
  const{numbers,...main}=d;
  const{data,error}=await supabaseClient.from('applications_5c').insert({...main,officer_id:oid}).select().single();
  if(error)throw error;
  if(numbers&&numbers.length){const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:data.id}));if(rows.length)await supabaseClient.from('application_5c_numbers').insert(rows);}
  offlineStore.cache('fivec_cache',{...data,application_5c_numbers:numbers||[]}).catch(()=>{});
  return data;
}
async function updateApplication5C(id,d,numbers){
  const cached=await offlineStore.getOne('fivec_cache',id);
  if(cached)await offlineStore.cache('fivec_cache',{...cached,...d,application_5c_numbers:numbers!==undefined?numbers:(cached.application_5c_numbers||[])});
  if(!navigator.onLine){
    await offlineStore.enqueue('fivec','update',{id,...d,numbers});
    _showSyncBar('pending','📴 5-C update saved offline — will sync when connected');
    return;
  }
  const{error}=await supabaseClient.from('applications_5c').update(d).eq('id',id);
  if(error)throw error;
  if(numbers!==undefined){await supabaseClient.from('application_5c_numbers').delete().eq('application_5c_id',id);const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));if(rows.length)await supabaseClient.from('application_5c_numbers').insert(rows);}
}
async function deleteApplication5C(id){
  if(!navigator.onLine){
    await offlineStore.remove('fivec_cache',id);
    await offlineStore.enqueue('fivec','delete',{id});
    _showSyncBar('pending','📴 5-C deletion queued — will sync when connected');
    return;
  }
  const{data:atts}=await supabaseClient.from('application_5c_attachments').select('storage_path').eq('application_5c_id',id);
  if(atts&&atts.length)await supabaseClient.storage.from('5c-attachments').remove(atts.map(a=>a.storage_path));
  const{error}=await supabaseClient.from('applications_5c').delete().eq('id',id);
  if(error)throw error;
  offlineStore.remove('fivec_cache',id).catch(()=>{});
}
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
    <td><b>${a.serial_number}</b></td><td>${esc5C(a.complainant_name)||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCNIC(a.complainant_cnic))}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCell(a.complainant_cell))}</td>
    <td>${nums}</td>
    <td style="font-size:11px;">${toDisplayDate(a.application_date)||'—'}</td>
    <td style="font-size:11px;">${toDisplayDate(a.response_date)||'—'}</td>
    <td><span class="pill ${FIVEC_STATUS_CLS[a.status]||'pill-blue'}">${FIVEC_STATUS[a.status]||a.status}</span></td>
    <td style="text-align:center;">📎 ${att}</td>
    <td style="white-space:nowrap;">
      <button class="btn btn-secondary btn-sm" onclick="open5CForm('${a.id}')">✏️</button>
      <button class="btn btn-primary btn-sm" onclick="open5CResponse('${a.id}')">📝</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDelete5C('${a.id}',${a.serial_number})">🗑️</button>
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
  <div style="font-weight:600;margin-bottom:10px;font-size:13px;">📋 Application Numbers <span style="font-weight:400;color:var(--text-muted);font-size:11px;">(each forwarding senior officer assigns their own number)</span></div>
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
  setTimeout(()=>{const c=document.querySelector('.modal-card');if(c){c.style.maxWidth='880px';c.style.width='94vw';}},10);
}
function render5CNumberRow(n){
  const inp='padding:7px 9px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:5px;color:var(--text-primary);font-size:12px;width:100%;box-sizing:border-box;';
  const isOther=n.senior_officer_designation==='Other';
  return `<div class="f5c-num-row" style="background:var(--bg-tertiary);border:1px solid var(--border-light);border-radius:8px;padding:10px;margin-bottom:8px;">
    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px;">
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Application Number</div><input style="${inp}" placeholder="e.g. 1234/IGP/2026" data-field="application_number" value="${esc5C(n.application_number||'')}"></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Senior Officer Designation</div>
        <select style="${inp}" data-field="senior_officer_designation" onchange="handleDesig5C(this)"><option value="">— Select —</option>${FIVEC_DESIGNATIONS.map(d=>`<option value="${d}" ${n.senior_officer_designation===d?'selected':''}>${d}</option>`).join('')}</select>
        <input class="desig-custom" style="${inp};margin-top:6px;display:${isOther?'block':'none'};" placeholder="Enter designation..." data-field="senior_officer_designation_custom" value="${esc5C(isOther?n.senior_officer_name||'':'')}">
      </div>
      <button class="btn btn-danger btn-sm" type="button" onclick="this.closest('.f5c-num-row').remove()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Officer Name (optional)</div><input style="${inp}" placeholder="Officer full name" data-field="senior_officer_name" value="${esc5C(!isOther?n.senior_officer_name||'':'')}"></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;font-weight:600;">Forwarded Date (DD/MM/YYYY)</div><input style="${inp}" placeholder="DD/MM/YYYY" data-field="forwarded_date" value="${toDisplayDate(n.forwarded_date)}" oninput="autoMaskDate5C(this)" maxlength="10"></div>
    </div>
  </div>`;
}
function handleDesig5C(sel){const c=sel.closest('.f5c-num-row').querySelector('.desig-custom');if(c){c.style.display=sel.value==='Other'?'block':'none';if(sel.value!=='Other')c.value='';}}
function add5CNumberRow(){const c=document.getElementById('f5c-numbers');const tmp=document.createElement('div');tmp.innerHTML=render5CNumberRow({});c.appendChild(tmp.firstElementChild);}
function render5CAttachmentRow(a){const ic=a.category==='application_scan'?'📄':a.category==='response_scan'?'📝':'📎';const lb=a.category==='application_scan'?'Application Scan':a.category==='response_scan'?'Response Scan':'Other';const sz=a.file_size?` · ${(a.file_size/1024).toFixed(1)}KB`:'';return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:6px;"><span style="font-size:18px;">${ic}</span><span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;">${esc5C(a.file_name)} <span style="color:var(--text-muted);font-size:10px;">(${lb}${sz})</span></span><button class="btn btn-secondary btn-sm" onclick="view5CAttachment('${a.storage_path}')">👁️</button><button class="btn btn-danger btn-sm" onclick="delete5CAttachment('${a.id}','${a.storage_path}',this)">🗑️</button></div>`;}
async function upload5CFile(appId,category,file){if(!file)return;if(file.size>10*1024*1024){showToast('⚠️ File too large (max 10 MB).','error');return;}showToast('⏳ Uploading...','info');try{await uploadAttachment5C(appId,file,category);showToast('✅ Uploaded!','success');open5CForm(appId);}catch(e){showToast('❌ Upload failed: '+e.message,'error',5000);}}
async function view5CAttachment(path){const url=await getAttachmentUrl5C(path);if(url)window.open(url,'_blank');else showToast('❌ Could not get file URL','error');}
async function delete5CAttachment(id,path,btn){if(!confirm('Delete this attachment?'))return;try{await deleteAttachment5C(id,path);if(btn&&btn.closest('div'))btn.closest('div').remove();showToast('🗑️ Deleted','info');}catch(e){showToast('❌ '+e.message,'error');}}
async function save5CApp(id){
  const main={complainant_name:document.getElementById('f5c-name').value.trim()||null,complainant_cnic:document.getElementById('f5c-cnic').value.trim()||null,complainant_cell:document.getElementById('f5c-cell').value.trim()||null,application_date:toISODate(document.getElementById('f5c-appdate').value)||null,response_date:toISODate(document.getElementById('f5c-respdate').value)||null,subject:document.getElementById('f5c-subject').value.trim()||null,status:document.getElementById('f5c-status').value};
  const numbers=Array.from(document.querySelectorAll('.f5c-num-row')).map(row=>{const r={};row.querySelectorAll('[data-field]').forEach(el=>{r[el.dataset.field]=el.value.trim()||null;});if(r.senior_officer_designation==='Other'){const c=row.querySelector('.desig-custom');r.senior_officer_designation=c&&c.value.trim()?c.value.trim():'Other';}if(r.forwarded_date)r.forwarded_date=toISODate(r.forwarded_date)||r.forwarded_date;delete r.senior_officer_designation_custom;return r;}).filter(n=>n.application_number);
  try{if(id){await updateApplication5C(id,main,numbers);showToast('✅ Updated','success');}else{await addApplication5C({...main,numbers});showToast('✅ Application added','success');}closeModal();renderFiveC(document.getElementById('page-content'));}catch(e){showToast('❌ '+e.message,'error',5000);}
}
function confirmDelete5C(id,sn){if(!confirm(`Delete Application #${sn} and ALL its attachments?`))return;deleteApplication5C(id).then(()=>{showToast('🗑️ Deleted','info');renderFiveC(document.getElementById('page-content'));}).catch(e=>showToast('❌ '+e.message,'error'));}

// ── RESPONSE WRITER ──
// Saved selection — restored after clicking toolbar selects so text stays highlighted
let _r5cSel=null;
function _saveSel5C(){const s=window.getSelection();if(s&&s.rangeCount)_r5cSel=s.getRangeAt(0).cloneRange();}
function _restoreSel5C(){if(!_r5cSel)return;const s=window.getSelection();s.removeAllRanges();s.addRange(_r5cSel);}

async function open5CResponse(id){
  const app=await getApplication5C(id);if(!app){showToast('❌ Not found','error');return;}
  const o=currentOfficer||{};
  const today=new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'});
  // Only pull application numbers — no officer rank or designation
  const refs=(app.application_5c_numbers||[]).map(n=>esc5C(n.application_number||'')).filter(Boolean).join('، ')||'—';

  // Initial content — uses <br> for spacing (not margin-bottom which propagates on Enter)
  const initial=app.response_text||`<div dir="rtl">تھانہ: ${esc5C(o.station||'')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ضلع: ${esc5C(o.district||'')}</div>
<br>
<div dir="rtl">درخواست نمبری: ${refs}</div>
<br>
<div dir="rtl">درخواست ازاں: ${esc5C(app.complainant_name||'')}</div>
<br>
<div dir="rtl">شناختی کارڈ نمبر: ${esc5C(formatCNIC(app.complainant_cnic)||'')} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; رابطہ نمبر: ${esc5C(formatCell(app.complainant_cell)||'')}</div>
<br>
<br>
<div dir="rtl">جنابِ عالیٰ!</div>
<br>
<div dir="rtl"></div>`;

  // Toolbar button style — note: onmousedown="event.preventDefault()" keeps selection alive
  const B=(label,fn,tip)=>`<button class="r5b" onmousedown="event.preventDefault()" onclick="${fn}" title="${tip}">${label}</button>`;
  const sep=`<div class="r5s"></div>`;

  const overlay=document.createElement('div');
  overlay.id='response5c-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,16,25,0.97);display:flex;flex-direction:column;';
  overlay.innerHTML=`
  <style>
    /* Ribbon button (light Word-like theme) */
    .r5b{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;padding:2px 6px;background:transparent;border:1px solid transparent;border-radius:3px;cursor:pointer;font-size:13px;color:#2c2c2c;white-space:nowrap;}
    .r5b:hover{background:#dde4ec;border-color:#a8b8cc;}
    .r5b:active{background:#bccadc;}
    .r5s{width:1px;height:22px;background:#c0c8d0;margin:0 4px;flex-shrink:0;}
    .r5sel{padding:2px 5px;background:white;border:1px solid #bbb;border-radius:3px;font-size:12px;color:#222;height:26px;}
    .r5sel:hover{border-color:#666;}
    /* Fix 1: zero out margins inside A4 so Enter doesn't jump 4 lines */
    #a4-paper div, #a4-paper p, #a4-paper li{margin:0!important;padding:0!important;}
    #a4-paper br{line-height:inherit;}
    /* Fix 4: hide page borders when printing */
    @media print{
      #a4-paper{border:none!important;background-image:none!important;box-shadow:none!important;padding:0!important;min-height:auto!important;}
    }
  </style>
  <!-- Title bar -->
  <div style="background:#0f1923;padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #1a3148;flex-wrap:wrap;">
    <span style="font-weight:700;color:#e8f0fe;flex:1;font-size:13px;">📝 Response — App #${app.serial_number} · ${esc5C(app.complainant_name||'')}</span>
    <button class="btn btn-primary btn-sm" onmousedown="event.preventDefault()" onclick="save5CResponse('${id}')">💾 Save</button>
    <button class="btn btn-secondary btn-sm" onmousedown="event.preventDefault()" onclick="downloadResponse5C('${id}','${esc5C((app.complainant_name||'response').replace(/[^\w]/g,'_'))}')">⬇️ Download</button>
    <button class="btn btn-secondary btn-sm" onmousedown="event.preventDefault()" onclick="print5CResponse()">🖨️ Print</button>
    <button class="btn btn-danger btn-sm" onclick="document.getElementById('response5c-overlay').remove()">✕ Close</button>
  </div>
  <!-- Word-like ribbon -->
  <div style="background:#f2f2f2;border-bottom:2px solid #c4c4c4;padding:5px 10px;display:flex;align-items:center;gap:2px;flex-wrap:wrap;">
    <!-- Undo / Redo -->
    ${B('↩','exec5C(\'undo\')','Undo')}${B('↪','exec5C(\'redo\')','Redo')}
    ${sep}
    <!-- Font family — saves selection before opening, restores after change -->
    <select class="r5sel" id="r5font" onfocus="_saveSel5C()" onchange="_restoreSel5C();applyFont5C(this.value)" style="min-width:160px;" title="Font family">
      <option value="'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif">اردو — Jameel Noori</option>
      <option value="'Noto Nastaliq Urdu',serif">Noto Nastaliq Urdu</option>
      <option value="'Arial',sans-serif">Arial</option>
      <option value="'Times New Roman',serif">Times New Roman</option>
      <option value="'Courier New',monospace">Courier New</option>
      <option value="'Aptos','Segoe UI',sans-serif">Aptos / Segoe UI</option>
    </select>
    <!-- Font size -->
    <select class="r5sel" id="r5size" onfocus="_saveSel5C()" onchange="_restoreSel5C();applyFontSize5C(this.value)" style="width:56px;" title="Font size">
      ${[8,9,10,11,12,13,14,16,18,20,22,24,28,32,36,48].map(s=>`<option value="${s}pt" ${s===14?'selected':''}>${s}</option>`).join('')}
    </select>
    ${sep}
    <!-- Bold / Italic / Underline / Strikethrough -->
    ${B('<b>B</b>','exec5C(\'bold\')','Bold (Ctrl+B)')}
    ${B('<i>I</i>','exec5C(\'italic\')','Italic (Ctrl+I)')}
    ${B('<u>U</u>','exec5C(\'underline\')','Underline (Ctrl+U)')}
    ${B('<s>S</s>','exec5C(\'strikeThrough\')','Strikethrough')}
    ${sep}
    <!-- Text colour -->
    <label class="r5b" style="cursor:pointer;" title="Text colour" onmousedown="event.preventDefault()">
      A&nbsp;<input type="color" id="r5color" onchange="document.execCommand('foreColor',false,this.value)" style="width:18px;height:16px;padding:1px;border:none;cursor:pointer;vertical-align:middle;">
    </label>
    ${sep}
    <!-- Line spacing -->
    <select class="r5sel" id="r5lh" onfocus="_saveSel5C()" onchange="_restoreSel5C();setLineSpacing5C(this.value)" style="width:78px;" title="Line spacing">
      <option value="1.0">≡ 1.0</option>
      <option value="1.15">≡ 1.15</option>
      <option value="1.5" selected>≡ 1.5</option>
      <option value="1.75">≡ 1.75</option>
      <option value="2.0">≡ 2.0</option>
      <option value="2.5">≡ 2.5</option>
      <option value="3.0">≡ 3.0</option>
    </select>
    ${sep}
    <!-- Alignment -->
    ${B('⬅','align5C(\'justifyRight\')','Align Right (Urdu)')}
    ${B('⬌','align5C(\'justifyCenter\')','Center')}
    ${B('➡','align5C(\'justifyLeft\')','Align Left')}
    ${B('☰','align5C(\'justifyFull\')','Justify / toggle off')}
    ${sep}
    <!-- Indent -->
    ${B('⇥','indent5C(\'in\')','Increase indent')}
    ${B('⇤','indent5C(\'out\')','Decrease indent')}
    ${sep}
    <!-- Paragraph direction -->
    ${B('RTL ←','setParaDir5C(\'rtl\')','Set paragraph RTL (Urdu)')}
    ${B('→ LTR','setParaDir5C(\'ltr\')','Set paragraph LTR (English)')}
    ${sep}
    <!-- Lists -->
    ${B('•≡','exec5C(\'insertUnorderedList\')','Bullet list')}
    ${B('1≡','exec5C(\'insertOrderedList\')','Numbered list')}
    ${sep}
    <!-- Highlight colour -->
    <label class="r5b" style="cursor:pointer;" title="Highlight colour" onmousedown="event.preventDefault()">
      🖊&nbsp;<input type="color" value="#ffff00" onchange="_saveSel5C();_restoreSel5C();document.execCommand('hiliteColor',false,this.value)" style="width:18px;height:16px;padding:1px;border:none;cursor:pointer;vertical-align:middle;">
    </label>
    ${sep}
    <!-- Insert Table -->
    <div style="position:relative;display:inline-block;">
      <button class="r5b" onclick="_toggleTablePicker5C()" title="Insert Table">⊞ Table</button>
      <div id="r5-table-picker" style="display:none;position:absolute;top:100%;left:0;z-index:9999;background:#fff;border:1px solid #999;border-radius:6px;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);">
        <div style="font-size:10px;color:#666;margin-bottom:5px;text-align:center;" id="r5-table-label">rows × cols</div>
        <div style="display:grid;grid-template-columns:repeat(8,20px);gap:2px;">
          ${Array.from({length:64},(_,i)=>{const r=Math.floor(i/8)+1,cc=(i%8)+1;return'<div class="r5tgc" data-r="'+r+'" data-c="'+cc+'" onmouseover="_hoverTable5C('+r+','+cc+')" onclick="_insertTable5C('+r+','+cc+')" style="width:20px;height:20px;border:1px solid #bbb;border-radius:2px;cursor:pointer;"></div>';}).join('')}
        </div>
      </div>
    </div>
    ${sep}
    <!-- Page Size -->
    <select class="r5sel" onchange="_saveSel5C();_setPageSize5C(this.value)" style="width:68px;" title="Page size">
      <option value="210mm|297mm" selected>A4</option>
      <option value="297mm|420mm">A3</option>
      <option value="216mm|356mm">Legal</option>
      <option value="216mm|279mm">Letter</option>
    </select>
    <!-- Margins -->
    <select class="r5sel" onchange="_saveSel5C();_setMargins5C(this.value)" style="width:78px;" title="Margins">
      <option value="20mm 18mm 20mm 15mm" selected>Normal</option>
      <option value="12mm 10mm 12mm 10mm">Narrow</option>
      <option value="38mm 36mm 38mm 36mm">Wide</option>
      <option value="25mm 20mm 25mm 20mm">Moderate</option>
    </select>
    <!-- Page Border -->
    <button class="r5b" id="r5-border-btn" onclick="_toggleBorder5C()" title="Page Border">☐ Border</button>
    ${sep}
    <!-- Voice -->
    <button class="r5b" id="voice-btn" onclick="toggleVoiceInput()" title="Urdu Voice Input" style="color:#38bdf8;">🎙️ آواز</button>
  </div>
  <!-- Document area -->
  <div style="flex:1;overflow:auto;padding:28px 20px;background:#525659;display:flex;justify-content:center;align-items:flex-start;direction:ltr;">
    <div id="a4-paper" contenteditable="true" spellcheck="false"
      style="background:white;color:#111;width:210mm;min-height:297mm;max-width:100%;margin:0 auto;
             padding:20mm 18mm 20mm 15mm;
             box-shadow:0 4px 24px rgba(0,0,0,0.6);
             font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Aptos','Segoe UI',serif;
             font-size:14pt;
             line-height:1.5;
             word-spacing:3px;
             direction:rtl;unicode-bidi:plaintext;
             outline:none;
             background-image:
               linear-gradient(to left,  transparent 0.7cm, #888 0.7cm, #888 calc(0.7cm + 1px), transparent calc(0.7cm + 1px)),
               linear-gradient(to right, transparent 0.5cm, #aaa 0.5cm, #aaa calc(0.5cm + 1px), transparent calc(0.5cm + 1px));
             background-color:white;">${initial}</div>
  </div>`;
  document.body.appendChild(overlay);

  setTimeout(()=>{
    const paper=document.getElementById('a4-paper');
    if(!paper)return;
    paper.focus();
    // Native Enter → <br> (not <div>). This prevents Nastaleeq font's
    // large block-level spacing AND fixes RTL cursor placement — Chrome
    // handles cursor position correctly when Enter is native, not intercepted.
    document.execCommand('defaultParagraphSeparator',false,'br');

    // Tab + Enter keydown handler
    paper.addEventListener('keydown',function(e){
      // Tab → 0.5 inch tab stop (MS Word standard)
      if(e.key==='Tab'){
        e.preventDefault();
        const sel=window.getSelection();
        if(!sel.rangeCount)return;
        const range=sel.getRangeAt(0);
        range.deleteContents();
        const span=document.createElement('span');
        span.style.cssText='display:inline-block;width:0.5in;';
        span.textContent='\u00A0';
        range.insertNode(span);
        range.setStartAfter(span);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
    // Uses a RegExp on text nodes after every keystroke so it's IME-safe
    const arabicRe=/[٠-٩]/g;
    const arabicMap={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    paper.addEventListener('input',function(){
      if(!arabicRe.test(this.textContent)){arabicRe.lastIndex=0;return;}
      arabicRe.lastIndex=0;
      // Save caret
      const sel=window.getSelection();
      if(!sel.rangeCount)return;
      const range=sel.getRangeAt(0);
      const curNode=range.startContainer, curOff=range.startOffset;
      // Walk text nodes and replace — 1:1 so cursor offset stays valid
      const walker=document.createTreeWalker(this,NodeFilter.SHOW_TEXT,null,false);
      let node;
      while((node=walker.nextNode())){
        if(!arabicRe.test(node.textContent)){arabicRe.lastIndex=0;continue;}
        arabicRe.lastIndex=0;
        node.textContent=node.textContent.replace(/[٠-٩]/g,c=>arabicMap[c]);
      }
      // Restore caret (offset unchanged because replacement is 1:1)
      try{
        const nr=document.createRange();
        nr.setStart(curNode,Math.min(curOff,curNode.textContent?curNode.textContent.length:0));
        nr.collapse(true);sel.removeAllRanges();sel.addRange(nr);
      }catch(_){}
    });
  },80);
}

// ── EDITOR COMMANDS ──
function exec5C(cmd){document.execCommand(cmd,false,null);}

// ── TABLE PICKER (5-C) ────────────────────────────────────────
function _toggleTablePicker5C(){
  const p=document.getElementById('r5-table-picker');
  if(p)p.style.display=p.style.display==='none'?'block':'none';
}
function _hoverTable5C(r,c){
  document.querySelectorAll('#r5-table-picker .r5tgc').forEach(el=>{
    const on=+el.dataset.r<=r&&+el.dataset.c<=c;
    el.style.background=on?'rgba(56,189,248,0.3)':'';
    el.style.borderColor=on?'#0ea5e9':'#bbb';
  });
  const lbl=document.getElementById('r5-table-label');
  if(lbl)lbl.textContent=r+' rows × '+c+' cols';
}
function _insertTable5C(rows,cols){
  const p=document.getElementById('r5-table-picker');
  if(p)p.style.display='none';
  const paper=document.getElementById('a4-paper');
  if(!paper)return;
  paper.focus();
  let html='<table style="border-collapse:collapse;width:100%;margin:8px 0;"><tbody>';
  for(let r=0;r<rows;r++){
    html+='<tr>';
    for(let c=0;c<cols;c++)
      html+='<td style="border:1px solid #999;padding:6px 10px;min-width:50px;" contenteditable="true">&nbsp;</td>';
    html+='</tr>';
  }
  html+='</tbody></table><br>';
  document.execCommand('insertHTML',false,html);
}

// ── PAGE LAYOUT (5-C) ─────────────────────────────────────────
function _setPageSize5C(val){
  const paper=document.getElementById('a4-paper');
  if(!paper)return;
  const[w,h]=val.split('|');
  paper.style.width=w;paper.style.minHeight=h;
}
function _setMargins5C(val){
  const paper=document.getElementById('a4-paper');
  if(paper)paper.style.padding=val;
}
let _r5BorderOn=false;
function _toggleBorder5C(){
  const paper=document.getElementById('a4-paper');
  if(!paper)return;
  _r5BorderOn=!_r5BorderOn;
  paper.style.outline=_r5BorderOn?'2px solid #333':'none';
  const btn=document.getElementById('r5-border-btn');
  if(btn)btn.style.color=_r5BorderOn?'#0ea5e9':'';
}

// Close table picker on outside click
document.addEventListener('click',e=>{
  const p=document.getElementById('r5-table-picker');
  if(p&&!p.contains(e.target)&&!e.target.closest('[onclick*="_toggleTablePicker5C"]'))p.style.display='none';
  const mp=document.getElementById('misal-table-picker');
  if(mp&&!mp.contains(e.target)&&!e.target.closest('[onclick*="_mToggleTablePicker"]'))mp.style.display='none';
});

function applyFont5C(fontVal){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount&&!sel.isCollapsed){
    const span=document.createElement('span');span.style.fontFamily=fontVal;
    span.appendChild(sel.getRangeAt(0).extractContents());
    sel.getRangeAt(0).insertNode(span);
  }else{const p=document.getElementById('a4-paper');if(p)p.style.fontFamily=fontVal;}
}

function applyFontSize5C(sizeVal){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount&&!sel.isCollapsed){
    const span=document.createElement('span');span.style.fontSize=sizeVal;
    span.appendChild(sel.getRangeAt(0).extractContents());
    sel.getRangeAt(0).insertNode(span);
  }else{const p=document.getElementById('a4-paper');if(p)p.style.fontSize=sizeVal;}
}

function setLineSpacing5C(val){
  // Apply to the paper globally (affects all paragraphs)
  const p=document.getElementById('a4-paper');
  if(p)p.style.lineHeight=val;
}

// Fix 3 — Justify toggles OFF if already applied; other alignments just apply
function align5C(cmd){
  if(cmd==='justifyFull'&&document.queryCommandState&&document.queryCommandState('justifyFull')){
    document.execCommand('justifyRight',false,null); // toggle off → back to RTL default
  }else{
    document.execCommand(cmd,false,null);
  }
}

function indent5C(dir){
  const sel=window.getSelection();if(!sel.rangeCount)return;
  let node=sel.getRangeAt(0).commonAncestorContainer;
  if(node.nodeType===3)node=node.parentElement;
  const block=node.closest&&node.closest('p,div,h1,h2,h3,h4,li');
  if(!block||block.id==='a4-paper'){document.execCommand(dir==='in'?'indent':'outdent',false,null);return;}
  const rtl=window.getComputedStyle(block).direction==='rtl';
  const prop=rtl?'paddingRight':'paddingLeft';
  const cur=parseInt(block.style[prop]||'0');
  block.style[prop]=Math.max(0,Math.min(cur+(dir==='in'?24:-24),200))+'px';
}

function setParaDir5C(dir){
  const sel=window.getSelection();if(!sel.rangeCount)return;
  let node=sel.getRangeAt(0).commonAncestorContainer;
  if(node.nodeType===3)node=node.parentElement;
  const block=node.closest&&node.closest('p,div,h1,h2,h3,h4,li,blockquote');
  if(block&&block.id!=='a4-paper'){
    block.setAttribute('dir',dir);block.style.direction=dir;
    block.style.textAlign=dir==='rtl'?'right':'left';
  }else{
    document.execCommand('insertHTML',false,`<div dir="${dir}" style="direction:${dir};text-align:${dir==='rtl'?'right':'left'};">\u200B</div>`);
  }
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
  const lh=document.getElementById('a4-paper')?.style.lineHeight||'1.5';
  const full=`<!DOCTYPE html><html lang="ur"><head><meta charset="utf-8"><title>5-C Response</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:20mm 18mm 20mm 15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:${lh};word-spacing:3px;direction:rtl;margin:0;padding:0;color:#000;}div,p,li{margin:0;padding:0;}</style></head><body>${html}</body></html>`;
  const blob=new Blob([full],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`5C_${name}_${id.slice(0,8)}.html`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('⬇️ Offline copy downloaded','success');
}

// Fix: @page margin:0 pushes Chrome's timestamp/URL off the page.
// Body padding replaces it so content has proper A4 white space.
function print5CResponse(){
  const html=document.getElementById('a4-paper').innerHTML;
  const lh=document.getElementById('a4-paper')?.style.lineHeight||'1.5';
  const w=window.open('','_blank','width=900,height=1200');
  if(!w){showToast('⚠️ Allow pop-ups to print','error');return;}
  w.document.write(`<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
<meta charset="utf-8">
<title>\u0631\u0633\u0645\u06CC \u062C\u0648\u0627\u0628</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  /* @page margin:0 removes Chrome's auto timestamp + URL headers/footers */
  @page { size:A4; margin:0; }
  *   { box-sizing:border-box; }
  html{ background:white; }
  body{
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;
    font-size:14pt; line-height:${lh}; word-spacing:3px;
    direction:rtl; color:#000;
    margin:0;
    /* A4 margins as padding — right=start side for RTL */
    padding:20mm 18mm 20mm 15mm;
    width:210mm;
  }
  div,p,li{ margin:0!important; padding:0!important; }
  br{ display:block; }
  /* Preserve tab spans */
  span[style*="inline-block"]{ display:inline-block!important; }
</style>
</head>
<body>${html}<scr`+`ipt>
  // Trigger print after fonts have loaded
  document.fonts.ready.then(function(){ setTimeout(window.print, 300); });
<\/scr`+`ipt></body>
</html>`);
  w.document.close();
}
