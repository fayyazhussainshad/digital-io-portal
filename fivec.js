/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — 5-C APPLICATIONS TAB
   Track senior-officer-forwarded applications, write
   responses on A4, attach scans, search all fields.
   Loaded after app-core.js.
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════
//  5-C APPLICATIONS MODULE
//  Track applications forwarded by senior officers,
//  draft responses, attach scans, search by any field.
// ═══════════════════════════════════════════════════
const FIVEC_DESIGNATIONS=['IGP','RPO','CPO','SSP OPS','SSP/INV','DSP','Divisional SP','SP','SHO','Other'];
const FIVEC_STATUS={received:'موصول (Received)',in_progress:'زیر کارروائی (In Progress)',responded:'جواب دیا (Responded)',closed:'بند (Closed)'};
const FIVEC_STATUS_CLS={received:'pill-blue',in_progress:'pill-amber',responded:'pill-green',closed:'pill-purple'};

function esc5C(s){if(s===null||s===undefined)return'';return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// ── DB FUNCTIONS ──
async function getApplications5C(query){
  const oid=await getOfficerId();if(!oid)return[];
  const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('officer_id',oid).order('serial_number',{ascending:false});
  if(error){console.error('5C fetch error',error);return[];}
  let list=data||[];
  if(query){
    const s=query.toLowerCase().trim();
    list=list.filter(a=>
      (a.complainant_name||'').toLowerCase().includes(s)||
      (a.complainant_cnic||'').includes(s)||
      (a.complainant_cell||'').includes(s)||
      (a.subject||'').toLowerCase().includes(s)||
      String(a.serial_number||'').includes(s)||
      (a.application_5c_numbers||[]).some(n=>(n.application_number||'').toLowerCase().includes(s)||(n.senior_officer_designation||'').toLowerCase().includes(s)||(n.senior_officer_name||'').toLowerCase().includes(s))
    );
  }
  return list;
}
async function getApplication5C(id){
  const{data,error}=await supabaseClient.from('applications_5c').select('*, application_5c_numbers(*), application_5c_attachments(*)').eq('id',id).single();
  if(error){console.error(error);return null;}return data;
}
async function addApplication5C(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  const{numbers,...main}=d;
  const{data,error}=await supabaseClient.from('applications_5c').insert({...main,officer_id:oid}).select().single();
  if(error)throw error;
  if(numbers&&numbers.length){
    const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:data.id}));
    if(rows.length){const{error:e2}=await supabaseClient.from('application_5c_numbers').insert(rows);if(e2)console.error(e2);}
  }
  return data;
}
async function updateApplication5C(id,d,numbers){
  const{error}=await supabaseClient.from('applications_5c').update(d).eq('id',id);
  if(error)throw error;
  if(numbers!==undefined){
    await supabaseClient.from('application_5c_numbers').delete().eq('application_5c_id',id);
    const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));
    if(rows.length){const{error:e2}=await supabaseClient.from('application_5c_numbers').insert(rows);if(e2)console.error(e2);}
  }
}
async function deleteApplication5C(id){
  // Delete attachments from storage first
  const{data:atts}=await supabaseClient.from('application_5c_attachments').select('storage_path').eq('application_5c_id',id);
  if(atts&&atts.length){await supabaseClient.storage.from('5c-attachments').remove(atts.map(a=>a.storage_path));}
  const{error}=await supabaseClient.from('applications_5c').delete().eq('id',id);
  if(error)throw error;
}
async function uploadAttachment5C(appId,file,category){
  if(!currentUser)throw new Error('Not authenticated');
  const safeName=file.name.replace(/[^\w.\-]/g,'_');
  const path=`${currentUser.id}/${appId}/${Date.now()}_${safeName}`;
  const{error:upErr}=await supabaseClient.storage.from('5c-attachments').upload(path,file);
  if(upErr)throw upErr;
  const{data,error}=await supabaseClient.from('application_5c_attachments').insert({application_5c_id:appId,file_name:file.name,storage_path:path,file_size:file.size,mime_type:file.type,category}).select().single();
  if(error){await supabaseClient.storage.from('5c-attachments').remove([path]);throw error;}
  return data;
}
async function getAttachmentUrl5C(path){
  const{data,error}=await supabaseClient.storage.from('5c-attachments').createSignedUrl(path,3600);
  if(error){console.error(error);return null;}return data.signedUrl;
}
async function deleteAttachment5C(id,path){
  await supabaseClient.storage.from('5c-attachments').remove([path]);
  await supabaseClient.from('application_5c_attachments').delete().eq('id',id);
}

// ── PAGE RENDERER ──
registerPage('fivec',renderFiveC);
async function renderFiveC(container,query){
  query=query||'';
  const apps=await getApplications5C(query);
  container.innerHTML=`<div class="page-header"><div><div class="page-title">📋 5-C Applications</div><div class="page-subtitle">Applications forwarded by senior officers — track, respond, archive</div></div><button class="btn btn-primary" onclick="open5CForm()">+ New Application</button></div>
  <div class="card" style="margin-bottom:14px;padding:12px;">
    <input class="search-input" id="fivec-search" style="width:100%;" placeholder="🔍 Search by complainant name, CNIC, cell, application number, senior officer designation..." value="${esc5C(query)}" oninput="clearTimeout(window._5cTmr);window._5cTmr=setTimeout(()=>renderFiveC(document.getElementById('page-content'),this.value),250)">
    <div style="margin-top:6px;font-size:11px;color:var(--text-muted);">${apps.length} application${apps.length===1?'':'s'} ${query?'matching':'total'}</div>
  </div>
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;">
      <table class="data-table" style="width:100%;">
        <thead><tr>
          <th>S/N</th><th>Complainant</th><th>CNIC</th><th>Cell</th>
          <th>Application No(s) — Designation</th><th>App Date</th><th>Response Date</th>
          <th>Status</th><th>Files</th><th>Actions</th>
        </tr></thead>
        <tbody>${apps.length===0?`<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted);">${query?'No matches.':'No applications yet. Click <b>+ New Application</b> to add one.'}</td></tr>`:apps.map(render5CRow).join('')}</tbody>
      </table>
    </div>
  </div>`;
}
function render5CRow(a){
  const nums=(a.application_5c_numbers||[]).map(n=>`<div style="font-size:11px;line-height:1.5;"><b>${esc5C(n.application_number||'')}</b>${n.senior_officer_designation?` <span style="color:var(--text-muted);">— ${esc5C(n.senior_officer_designation)}</span>`:''}${n.senior_officer_name?` <span style="color:var(--text-faint);">(${esc5C(n.senior_officer_name)})</span>`:''}</div>`).join('')||'<span style="color:var(--text-muted);">—</span>';
  const att=(a.application_5c_attachments||[]).length;
  return `<tr>
    <td><b>${a.serial_number}</b></td>
    <td>${esc5C(a.complainant_name)||'—'}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCNIC(a.complainant_cnic))}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCell(a.complainant_cell))}</td>
    <td>${nums}</td>
    <td style="font-size:11px;">${a.application_date||'—'}</td>
    <td style="font-size:11px;">${a.response_date||'—'}</td>
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
  const inputStyle='width:100%;padding:8px 10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;';
  const labelStyle='display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;';
  const body=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <div><label style="${labelStyle}">Complainant Name</label><input style="${inputStyle}" id="f5c-name" value="${esc5C(app.complainant_name)}"></div>
    <div><label style="${labelStyle}">Complainant CNIC</label><input style="${inputStyle}" id="f5c-cnic" placeholder="36302-1234567-1" value="${esc5C(app.complainant_cnic)}"></div>
    <div><label style="${labelStyle}">Complainant Cell</label><input style="${inputStyle}" id="f5c-cell" placeholder="0300-1234567" value="${esc5C(app.complainant_cell)}"></div>
    <div><label style="${labelStyle}">Status</label><select style="${inputStyle}" id="f5c-status">${Object.entries(FIVEC_STATUS).map(([k,v])=>`<option value="${k}" ${app.status===k?'selected':''}>${v}</option>`).join('')}</select></div>
    <div><label style="${labelStyle}">Application Date</label><input style="${inputStyle}" type="date" id="f5c-appdate" value="${app.application_date||''}"></div>
    <div><label style="${labelStyle}">Response Date</label><input style="${inputStyle}" type="date" id="f5c-respdate" value="${app.response_date||''}"></div>
    <div style="grid-column:1/-1;"><label style="${labelStyle}">Subject / Summary</label><textarea style="${inputStyle};min-height:60px;font-family:inherit;" id="f5c-subject">${esc5C(app.subject)}</textarea></div>
  </div>
  <hr style="margin:18px 0;border:0;border-top:1px solid var(--border);">
  <div style="font-weight:600;margin-bottom:8px;font-size:13px;">📋 Application Numbers <span style="font-weight:400;color:var(--text-muted);font-size:11px;">(each senior officer assigns their own number when forwarding)</span></div>
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
}
function render5CNumberRow(n){
  const inp='padding:6px 8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:5px;color:var(--text-primary);font-size:12px;';
  return `<div class="f5c-num-row" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr auto;gap:6px;margin-bottom:6px;align-items:center;">
    <input style="${inp}" placeholder="Application Number" data-field="application_number" value="${esc5C(n.application_number||'')}">
    <select style="${inp}" data-field="senior_officer_designation"><option value="">— Designation —</option>${FIVEC_DESIGNATIONS.map(d=>`<option value="${d}" ${n.senior_officer_designation===d?'selected':''}>${d}</option>`).join('')}</select>
    <input style="${inp}" placeholder="Officer Name (optional)" data-field="senior_officer_name" value="${esc5C(n.senior_officer_name||'')}">
    <input style="${inp}" type="date" data-field="forwarded_date" value="${n.forwarded_date||''}" title="Forwarded date">
    <button class="btn btn-danger btn-sm" type="button" onclick="this.parentElement.remove()" title="Remove">✕</button>
  </div>`;
}
function add5CNumberRow(){
  const c=document.getElementById('f5c-numbers');const tmp=document.createElement('div');tmp.innerHTML=render5CNumberRow({});c.appendChild(tmp.firstElementChild);
}
function render5CAttachmentRow(a){
  const ic=a.category==='application_scan'?'📄':a.category==='response_scan'?'📝':'📎';
  const lb=a.category==='application_scan'?'Application Scan':a.category==='response_scan'?'Response Scan':'Other';
  const size=a.file_size?` · ${(a.file_size/1024).toFixed(1)}KB`:'';
  return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:6px;">
    <span style="font-size:18px;">${ic}</span>
    <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;">${esc5C(a.file_name)} <span style="color:var(--text-muted);font-size:10px;">(${lb}${size})</span></span>
    <button class="btn btn-secondary btn-sm" onclick="view5CAttachment('${a.storage_path}')" title="Open/Print">👁️</button>
    <button class="btn btn-danger btn-sm" onclick="delete5CAttachment('${a.id}','${a.storage_path}',this)" title="Delete">🗑️</button>
  </div>`;
}
async function upload5CFile(appId,category,file){
  if(!file)return;
  if(file.size>10*1024*1024){showToast('⚠️ File too large (max 10 MB).','error');return;}
  showToast('⏳ Uploading...','info');
  try{
    await uploadAttachment5C(appId,file,category);
    showToast('✅ Uploaded!','success');
    open5CForm(appId);
  }catch(e){showToast('❌ Upload failed: '+e.message,'error',5000);}
}
async function view5CAttachment(path){
  const url=await getAttachmentUrl5C(path);
  if(url)window.open(url,'_blank');else showToast('❌ Could not get file URL','error');
}
async function delete5CAttachment(id,path,btn){
  if(!confirm('Delete this attachment?'))return;
  try{
    await deleteAttachment5C(id,path);
    if(btn&&btn.closest('div'))btn.closest('div').remove();
    showToast('🗑️ Deleted','info');
  }catch(e){showToast('❌ '+e.message,'error');}
}
async function save5CApp(id){
  const main={
    complainant_name:document.getElementById('f5c-name').value.trim()||null,
    complainant_cnic:document.getElementById('f5c-cnic').value.trim()||null,
    complainant_cell:document.getElementById('f5c-cell').value.trim()||null,
    application_date:document.getElementById('f5c-appdate').value||null,
    response_date:document.getElementById('f5c-respdate').value||null,
    subject:document.getElementById('f5c-subject').value.trim()||null,
    status:document.getElementById('f5c-status').value,
  };
  const numbers=Array.from(document.querySelectorAll('.f5c-num-row')).map(row=>{
    const r={};row.querySelectorAll('[data-field]').forEach(el=>{r[el.dataset.field]=el.value||null;});return r;
  }).filter(n=>n.application_number);
  try{
    if(id){await updateApplication5C(id,main,numbers);showToast('✅ Updated','success');}
    else{await addApplication5C({...main,numbers});showToast('✅ Application added','success');}
    closeModal();renderFiveC(document.getElementById('page-content'));
  }catch(e){showToast('❌ '+e.message,'error',5000);}
}
function confirmDelete5C(id,sn){
  if(!confirm(`Delete Application #${sn} and ALL its attachments? This cannot be undone.`))return;
  deleteApplication5C(id).then(()=>{showToast('🗑️ Deleted','info');renderFiveC(document.getElementById('page-content'));}).catch(e=>showToast('❌ '+e.message,'error'));
}

// ── RESPONSE WRITER (Full-screen A4) ──
async function open5CResponse(id){
  const app=await getApplication5C(id);if(!app){showToast('❌ Not found','error');return;}
  const o=currentOfficer||{};
  const today=new Date().toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'});
  const refs=(app.application_5c_numbers||[]).map(n=>esc5C(n.application_number||'')+(n.senior_officer_designation?` (${esc5C(n.senior_officer_designation)})`:'')).filter(Boolean).join('، ')||'—';
  const initial=app.response_text||`<div style="text-align:center;margin-bottom:24px;direction:rtl;">
  <div style="font-size:18pt;font-weight:bold;">${esc5C(o.station||'')}، ${esc5C(o.district||'')}</div>
  <div style="font-size:11pt;color:#555;margin-top:6px;">تاریخ: ${today}</div>
</div>
<div style="margin-bottom:12px;direction:rtl;"><b>بسلسلہ (Reference):</b> ${refs}</div>
<div style="margin-bottom:12px;direction:rtl;"><b>درخواست گزار (Complainant):</b> ${esc5C(app.complainant_name||'—')}${app.complainant_cnic?` · CNIC: ${esc5C(formatCNIC(app.complainant_cnic))}`:''}${app.complainant_cell?` · ${esc5C(formatCell(app.complainant_cell))}`:''}</div>
<div style="margin-bottom:12px;direction:rtl;"><b>موضوع (Subject):</b> ${esc5C(app.subject||'—')}</div>
<hr style="margin:18px 0;border:0;border-top:1px solid #999;">
<div style="margin-bottom:8px;direction:rtl;"><b>رپورٹ / جواب (Report / Response):</b></div>
<div style="min-height:300px;direction:rtl;">یہاں جواب لکھیں ... / Write your response here ...</div>
<div style="margin-top:60px;display:flex;justify-content:space-between;direction:rtl;">
  <div>دستخط ____________________</div>
  <div>${esc5C(o.full_name||'')}<br>${esc5C(o.designation||'')}</div>
</div>`;
  const overlay=document.createElement('div');
  overlay.id='response5c-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;';
  overlay.innerHTML=`<div style="background:var(--bg-secondary);padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <div style="font-weight:700;margin-right:auto;color:var(--text-primary);">📝 Response — App #${app.serial_number} · ${esc5C(app.complainant_name||'')}</div>
    <button class="btn btn-secondary btn-sm" onclick="exec5C('bold')" title="Bold (Ctrl+B)"><b>B</b></button>
    <button class="btn btn-secondary btn-sm" onclick="exec5C('italic')" title="Italic"><i>I</i></button>
    <button class="btn btn-secondary btn-sm" onclick="exec5C('underline')" title="Underline"><u>U</u></button>
    <button class="btn btn-secondary btn-sm" onclick="font5C('Jameel Noori Nastaleeq')" title="Urdu font">اردو</button>
    <button class="btn btn-secondary btn-sm" onclick="font5C('Aptos')" title="English font">English</button>
    <button class="btn btn-secondary btn-sm" onclick="size5C(1)" title="Smaller">A−</button>
    <button class="btn btn-secondary btn-sm" onclick="size5C(2)" title="Bigger">A+</button>
    <button class="btn btn-secondary btn-sm" onclick="dir5C('rtl')" title="Right-to-left">→ RTL</button>
    <button class="btn btn-secondary btn-sm" onclick="dir5C('ltr')" title="Left-to-right">LTR ←</button>
    <button class="btn btn-secondary btn-sm" onclick="print5CResponse()" title="Print">🖨️ Print</button>
    <button class="btn btn-secondary btn-sm" onclick="downloadResponse5C('${id}','${esc5C(app.complainant_name||'response').replace(/[^\\w]/g,'_')}')" title="Download offline copy">⬇️ Download</button>
    <button class="btn btn-primary btn-sm" onclick="save5CResponse('${id}')" title="Save to online database">💾 Save Online</button>
    <button class="btn btn-danger btn-sm" onclick="document.getElementById('response5c-overlay').remove()">✕ Close</button>
  </div>
  <div style="flex:1;overflow:auto;padding:20px;background:#3a3a3a;">
    <div id="a4-paper" contenteditable="true" spellcheck="false" style="background:white;color:black;width:210mm;min-height:297mm;max-width:100%;margin:0 auto;padding:25mm 20mm;box-shadow:0 8px 30px rgba(0,0,0,0.5);font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Aptos','Segoe UI',serif;font-size:14pt;line-height:1.9;direction:rtl;outline:none;border-radius:2px;">${initial}</div>
  </div>`;
  document.body.appendChild(overlay);
}
function exec5C(cmd){document.execCommand(cmd,false,null);}
function font5C(font){
  const sel=window.getSelection();
  if(sel.rangeCount&&!sel.isCollapsed){
    const span=document.createElement('span');span.style.fontFamily=font;
    span.appendChild(sel.getRangeAt(0).extractContents());
    sel.getRangeAt(0).insertNode(span);
  }else{document.getElementById('a4-paper').style.fontFamily=font+",'Noto Nastaliq Urdu',serif";}
}
function size5C(dir){
  const el=document.getElementById('a4-paper');const cur=parseFloat(getComputedStyle(el).fontSize);
  el.style.fontSize=(dir===2?cur+1:Math.max(8,cur-1))+'px';
}
function dir5C(d){document.getElementById('a4-paper').style.direction=d;}
async function save5CResponse(id){
  const html=document.getElementById('a4-paper').innerHTML;
  try{
    await supabaseClient.from('applications_5c').update({response_text:html,response_date:new Date().toISOString().split('T')[0],status:'responded'}).eq('id',id);
    showToast('✅ Response saved online','success');
  }catch(e){showToast('❌ Save failed: '+e.message,'error',5000);}
}
function downloadResponse5C(id,name){
  const html=document.getElementById('a4-paper').innerHTML;
  const full=`<!DOCTYPE html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><title>5-C Response — ${name}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:25mm 20mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:1.9;direction:rtl;margin:0;padding:25mm 20mm;color:#000;background:#fff}</style></head><body>${html}</body></html>`;
  const blob=new Blob([full],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`5C_Response_${name}_${id.slice(0,8)}.html`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('⬇️ Offline copy downloaded','success');
}
function print5CResponse(){
  const html=document.getElementById('a4-paper').innerHTML;
  const w=window.open('','_blank','width=900,height=1100');
  if(!w){showToast('⚠️ Allow pop-ups to print','error');return;}
  w.document.write(`<!DOCTYPE html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><title>Print Response</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:25mm 20mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:1.9;direction:rtl;margin:0;color:#000}</style></head><body>${html}<scr`+`ipt>window.onload=()=>setTimeout(()=>{window.print();},400);<\/scr`+`ipt></body></html>`);
  w.document.close();
}

