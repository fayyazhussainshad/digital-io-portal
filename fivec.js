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
// v538: آف لائن محفوظ ہونے کی اطلاع۔ پہلے یہاں ایک غیر موجود فنکشن
//   (_showSyncBar) تھا — ریکارڈ قطار میں محفوظ ہو جاتا، پھر غلطی آتی اور
//   افسر کو لگتا کہ محفوظ نہیں ہوا (دوبارہ کوشش = دوہرا اندراج)۔
function _fcOfflineNote(msg){try{if(typeof showToast==='function')showToast(msg,'info',4500);}catch(_){ /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }}
async function addApplication5C(d){
  const oid=await getOfficerId();if(!oid)throw new Error('Not authenticated');
  if(!navigator.onLine){
    const tempId='offline_5c_'+Date.now();
    const local={...d,id:tempId,officer_id:oid,created_at:new Date().toISOString(),_offline:true};
    await offlineStore.cache('fivec_cache',local);
    await offlineStore.enqueue('fivec','insert',{...d,officer_id:oid},tempId);
    _fcOfflineNote('5-C درخواست آف لائن محفوظ — انٹرنیٹ آنے پر sync ہو جائے گی');
    return local;
  }
  const{numbers,...main}=d;
  const{data,error}=await supabaseClient.from('applications_5c').insert({...main,officer_id:oid}).select().single();
  if(error)throw error;
  // v547: نمبروں کا نتیجہ بھی دیکھو — پہلے یہ خاموشی سے ضائع ہو جاتے۔ درخواست بن
  //   چکی، اس لیے throw نہیں (دوبارہ کوشش = دوہری درخواست)؛ صاف بتاؤ کہ نمبر رہ گئے۔
  let _nOk=true;
  if(numbers&&numbers.length){const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:data.id}));if(rows.length){const{error:nErr}=await supabaseClient.from('application_5c_numbers').insert(rows);if(nErr){_nOk=false;if(typeof dioLogError==='function')dioLogError('5-C numbers insert nakaam',nErr);}}}
  offlineStore.cache('fivec_cache',{...data,application_5c_numbers:_nOk?(numbers||[]):[]}).catch(()=>{});
  if(!_nOk){const e=new Error('درخواست محفوظ ہو گئی، مگر درخواست نمبر محفوظ نہیں ہوئے — درخواست کھول کر نمبر دوبارہ لکھ کر محفوظ کریں');e.code='DIO_5C_NUMBERS';throw e;}
  return data;
}
async function updateApplication5C(id,d,numbers){
  const cached=await offlineStore.getOne('fivec_cache',id);
  if(cached)await offlineStore.cache('fivec_cache',{...cached,...d,application_5c_numbers:numbers!==undefined?numbers:(cached.application_5c_numbers||[])});
  if(!navigator.onLine){
    await offlineStore.enqueue('fivec','update',{id,...d,numbers});
    _fcOfflineNote('5-C درخواست کی تبدیلی آف لائن محفوظ — انٹرنیٹ آنے پر sync ہو جائے گی');
    return;
  }
  // v547: 0 قطار (RLS/میعاد ختم) بھی ناکامی؛ اور نمبروں کا حذف/اندراج بھی دیکھ کر
  dioWriteOk(await supabaseClient.from('applications_5c').update(d).eq('id',id).select('id'),'5-C update',true);
  if(numbers!==undefined){dioWriteOk(await supabaseClient.from('application_5c_numbers').delete().eq('application_5c_id',id),'5-C numbers delete');const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));if(rows.length)dioWriteOk(await supabaseClient.from('application_5c_numbers').insert(rows),'5-C numbers insert');}
}
async function deleteApplication5C(id){
  if(!navigator.onLine){
    await offlineStore.remove('fivec_cache',id);
    await offlineStore.enqueue('fivec','delete',{id});
    _fcOfflineNote('5-C درخواست حذف کرنا قطار میں — انٹرنیٹ آنے پر sync ہو جائے گا');
    return;
  }
  const{data:atts}=await supabaseClient.from('application_5c_attachments').select('storage_path').eq('application_5c_id',id);
  // v547: پہلے درخواست (نتیجہ دیکھ کر)، پھر فائلیں — پہلے فائلیں مٹتیں اور درخواست کا
  //   حذف رد ہوتا (مثلاً میعاد ختم) تو درخواست رہ جاتی مگر اس کی منسلکہ فائلیں ضائع۔
  dioWriteOk(await supabaseClient.from('applications_5c').delete().eq('id',id).select('id'),'5-C delete',true);
  if(atts&&atts.length){const{error:sErr}=await supabaseClient.storage.from('5c-attachments').remove(atts.map(a=>a.storage_path));if(sErr&&typeof dioLogError==='function')dioLogError('5-C files hazf nakaam',sErr);}
  offlineStore.remove('fivec_cache',id).catch(()=>{});
}
async function uploadAttachment5C(appId,file,category){if(!currentUser)throw new Error('Not authenticated');const safeName=file.name.replace(/[^\w.\-]/g,'_');const path=`${currentUser.id}/${appId}/${Date.now()}_${safeName}`;const{error:upErr}=await supabaseClient.storage.from('5c-attachments').upload(path,file);if(upErr)throw upErr;const{data,error}=await supabaseClient.from('application_5c_attachments').insert({application_5c_id:appId,file_name:file.name,storage_path:path,file_size:file.size,mime_type:file.type,category}).select().single();if(error){await supabaseClient.storage.from('5c-attachments').remove([path]);throw error;}return data;}
async function getAttachmentUrl5C(path){const{data,error}=await supabaseClient.storage.from('5c-attachments').createSignedUrl(path,3600);if(error){console.error(error);return null;}return data.signedUrl;}
// v547: پہلے ریکارڈ (نتیجہ دیکھ کر)، پھر فائل — پہلے فائل مٹتی اور ریکارڈ کا حذف ناکام
//   ہوتا تو فہرست میں ایسی منسلکہ رہ جاتی جس کی فائل ہی نہیں۔
async function deleteAttachment5C(id,path){dioWriteOk(await supabaseClient.from('application_5c_attachments').delete().eq('id',id).select('id'),'5-C attachment delete',true);const{error:sErr}=await supabaseClient.storage.from('5c-attachments').remove([path]);if(sErr&&typeof dioLogError==='function')dioLogError('5-C attachment file hazf nakaam',sErr);}

// ── PAGE RENDERER ──
registerPage('fivec',renderFiveC);
/* ═══════════════════════════════════════════════════════════
   PURANI KHARABI: talaash ke khane ka `oninput` poore safhe ko
   dobara banata tha (`renderFiveC(page-content, ...)`). Khana
   khud mit kar naya ban jata tha — is liye do-teen harf ke baad
   cursor gayab, aur aage likha hi nahi ja sakta tha.
   AB: sirf `#f5c-rows` (qatarein) aur ginti badalti hai.
   Is safhe ki apni halat `_f5cQuery` mein — koi doosri file
   is ko nahi chhuti.
   ═══════════════════════════════════════════════════════════ */
let _f5cQuery = '';

async function _f5cRefreshRows() {
  const tb = document.getElementById('f5c-rows');
  if (!tb) return;
  const apps = await getApplications5C(_f5cQuery);
  tb.innerHTML = apps.length === 0
    ? `<tr><td colspan="9">${
        (window.DIO && DIO.states)
          ? DIO.states.empty('doc',
              _f5cQuery ? '\u06a9\u0648\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u06c1\u06cc\u06ba \u0645\u0644\u06cc' : '\u0627\u0628\u06be\u06cc \u06a9\u0648\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u06c1\u06cc\u06ba',
              _f5cQuery ? '\u0644\u0641\u0638 \u0628\u062f\u0644 \u06a9\u0631 \u062f\u06cc\u06a9\u06be\u06cc\u06ba' : '"+ \u0646\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a" \u067e\u0631 \u062f\u0628\u0627\u0626\u06cc\u06ba')
          : '<div style="text-align:center;padding:36px;color:var(--text-muted);">\u06a9\u0648\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u06c1\u06cc\u06ba</div>'
      }</td></tr>`
    : apps.map(render5CRow).join('');
  const c = document.getElementById('f5c-count');
  if (c) c.textContent = apps.length;
}
window._f5cRefreshRows = _f5cRefreshRows;

function _f5cOnSearch(v) {
  _f5cQuery = String(v || '').trim();
  clearTimeout(window._5cTmr);
  window._5cTmr = setTimeout(_f5cRefreshRows, 280);
}
window._f5cOnSearch = _f5cOnSearch;

async function renderFiveC(container, query) {
  _f5cQuery = query || '';
  const apps = await getApplications5C(_f5cQuery);
  container.innerHTML = `<div class="page-header">
    <button class="btn btn-primary dio-add-btn" onclick="open5CForm()">+ درخواست درج کریں</button>
    <div>
      <div class="page-title">\u0645\u0627\u0631\u06a9 \u0634\u062f\u06c1 \u062f\u0631\u062e\u0648\u0627\u0633\u062a\u06cc\u06ba</div>
      <div class="page-subtitle"><span id="f5c-count">${apps.length}</span> \u062f\u0631\u062e\u0648\u0627\u0633\u062a\u06cc\u06ba</div>
    </div>
  </div>
  <div class="card" style="margin-bottom:14px;padding:12px;">
    <input class="search-input" id="fivec-search" style="width:100%;" dir="rtl"
      placeholder="\u0645\u062f\u0639\u06cc \u06a9\u0627 \u0646\u0627\u0645\u060c \u0634\u0646\u0627\u062e\u062a\u06cc \u06a9\u0627\u0631\u0688\u060c \u0645\u0648\u0628\u0627\u0626\u0644\u060c \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u0645\u0628\u0631 \u06cc\u0627 \u0639\u06c1\u062f\u06c1\u2026"
      value="${esc5C(_f5cQuery)}" oninput="_f5cOnSearch(this.value)">
  </div>
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;"><table class="data-table fivec-center-table" style="width:100%;">
      <thead><tr><th>#</th><th>\u0645\u062f\u0639\u06cc</th><th>\u0634\u0646\u0627\u062e\u062a\u06cc \u06a9\u0627\u0631\u0688</th><th>\u0645\u0648\u0628\u0627\u0626\u0644</th><th>\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u0645\u0628\u0631 \u2014 \u0639\u06c1\u062f\u06c1</th><th>\u062a\u0627\u0631\u06cc\u062e</th><th>\u0635\u0648\u0631\u062a\u062d\u0627\u0644</th><th>\u0645\u0646\u0633\u0644\u06a9\u0627\u062a</th><th>\u0627\u0642\u062f\u0627\u0645\u0627\u062a</th></tr></thead>
      <tbody id="f5c-rows">${apps.length === 0
        ? `<tr><td colspan="9">${(window.DIO && DIO.states)
            ? DIO.states.empty('doc', '\u0627\u0628\u06be\u06cc \u06a9\u0648\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u06c1\u06cc\u06ba', '"+ \u0646\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a" \u067e\u0631 \u062f\u0628\u0627\u0626\u06cc\u06ba')
            : '<div style="text-align:center;padding:36px;color:var(--text-muted);">\u06a9\u0648\u0626\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u06c1\u06cc\u06ba</div>'}</td></tr>`
        : apps.map(render5CRow).join('')}</tbody>
    </table></div>
  </div>`;
}
function render5CRow(a){
  const nums=(a.application_5c_numbers||[]).map(n=>`<div style="font-size:11px;line-height:1.5;"><b>${esc5C(n.application_number||'')}</b>${n.senior_officer_designation?` <span style="color:var(--text-muted);">— ${esc5C(n.senior_officer_designation)}</span>`:''}</div>`).join('')||'<span style="color:var(--text-muted);">—</span>';
  const att=(a.application_5c_attachments||[]).length;
  return `<tr>
    <td><b>${a.serial_number}</b></td><td>${esc5C(a.complainant_name)||'—'}${a.fir_number?`<div style="font-size:10.5pt;color:var(--accent);">مقدمہ <span dir="ltr" style="unicode-bidi:isolate;">${esc5C(a.fir_number)}</span></div>`:''}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCNIC(a.complainant_cnic))}</td>
    <td style="font-family:var(--font-mono);font-size:11px;">${esc5C(formatCell(a.complainant_cell))}</td>
    <td>${nums}</td>
    <td style="font-size:11px;">${toDisplayDate(a.application_date)||'—'}</td>
    <td><span class="pill ${FIVEC_STATUS_CLS[a.status]||'pill-blue'}">${esc5C(FIVEC_STATUS[a.status]||a.status)}</span></td>
    <td style="text-align:center;">${att}</td>
    <td style="white-space:nowrap;direction:rtl;">
      <button aria-label="ترمیم" class="btn btn-secondary btn-sm" onclick="open5CForm('${a.id}')" title="ترمیم"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
      <label class="btn btn-secondary btn-sm" style="cursor:pointer;" title="فائل منسلک کریں"><input type="file" style="display:none;" onchange="upload5CFile('${a.id}','attachment',this.files[0])"> 📎</label>
      <button aria-label="جواب" class="btn btn-primary btn-sm" onclick="open5CResponse('${a.id}')" title="جواب"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4.5 4h15v12H8l-3.5 3.5z"/><path d="M8 9h8"/><path d="M8 12.5h5"/></svg></button>
      <button aria-label="پرنٹ" class="btn btn-secondary btn-sm" onclick="_print5C('${a.id}')" title="پرنٹ"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg></button>
      <button class="btn btn-secondary btn-sm" onclick="_export5CPdf('${a.id}')" title="PDF عدالت کے لیے">PDF</button>
      <button aria-label="شیئر" class="btn btn-secondary btn-sm" onclick="dioSharePrint(()=>_print5C('${a.id}'),'درخواست 5C')" title="شیئر — PDF / Word"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg></button>
      <button aria-label="حذف" class="btn btn-danger btn-sm" onclick="confirmDelete5C('${a.id}',${a.serial_number})" title="حذف"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
    </td>
  </tr>`;
}

// ── NEW / EDIT — «نیا اندراج — 5-C درخواست» (مشترکہ DIO کارڈ، اکتوبر 2026) ──
async function open5CForm(id,opts){
  opts=opts||{};
  let app={complainant_name:'',complainant_cnic:'',complainant_cell:'',application_date:'',response_date:'',subject:'',status:'received',application_5c_numbers:[{}],application_5c_attachments:[]};
  if(id){const fetched=await getApplication5C(id);if(fetched)app=fetched;}
  const D=window.DIOCard;
  const nums=(app.application_5c_numbers&&app.application_5c_numbers.length)?app.application_5c_numbers:[{}];
  const body=
    (await D.caseField(app.case_id||opts.caseId||'', null, true))+
    D.nameField('f5c-name', app.complainant_name, 'درخواست دہندہ — نام و پتہ', false)+
    D.row([
      D.fld({id:'f5c-cnic',label:'شناختی کارڈ',type:'cnic',value:app.complainant_cnic}),
      D.fld({id:'f5c-cell',label:'موبائل',type:'mob',value:app.complainant_cell}),
      D.fld({id:'f5c-appdate',label:'تاریخ درخواست',type:'date',value:app.application_date}),
      D.fld({id:'f5c-status',label:'صورتحال',type:'sel',w:'w-l',grow:true,value:app.status,opts:Object.entries(FIVEC_STATUS)})
    ])+
    `<div id="f5c-numbers">${nums.map(render5CNumberRow).join('')}</div>
  <button class="btn btn-secondary btn-sm" type="button" onclick="add5CNumberRow()" style="margin-top:8px;">+ ایک اور درخواست نمبر</button>
  ${id?`<div style="font-weight:700;margin:14px 0 6px;">منسلک فائلیں</div>
  <div id="f5c-attachments">${(app.application_5c_attachments||[]).map(render5CAttachmentRow).join('')||'<div class="dio-hint">ابھی کوئی فائل منسلک نہیں۔</div>'}</div>
  <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','application_scan',this.files[0])"> درخواست کی نقل لگائیں</label>
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','response_scan',this.files[0])"> جواب کی نقل لگائیں</label>
    <label class="btn btn-secondary btn-sm" style="cursor:pointer;"><input type="file" style="display:none;" onchange="upload5CFile('${id}','attachment',this.files[0])"> دیگر فائل لگائیں</label>
    <label class="btn btn-primary btn-sm" style="cursor:pointer;"><input type="file" accept="image/*" capture="environment" style="display:none;" onchange="upload5CFile('${id}','application_scan',this.files[0])"> کیمرے سے اسکین کریں</label>
  </div>`:`<div class="dio-hint" style="margin-top:10px;">پہلے درخواست محفوظ کریں، پھر فائلیں منسلک کر کے جواب لکھ سکتے ہیں۔</div>`}`;
  D.open('\u20665-C\u2069 درخواست'+(id&&app.serial_number?' #'+app.serial_number:''), !!id, body, `save5CApp('${id||''}')`);
}
// ہر افسر بالا کا اپنا درخواست نمبر — ایک سطر: نمبر · عہدہ · افسر کا نام · تاریخ
function render5CNumberRow(n){
  const D=window.DIOCard;
  const isOther=n.senior_officer_designation==='Other'||(n.senior_officer_designation&&!FIVEC_DESIGNATIONS.includes(n.senior_officer_designation));
  const k=Math.random().toString(36).slice(2,8);
  const desigVal=isOther?'Other':(n.senior_officer_designation||'');
  return `<div class="f5c-num-row">`+D.row([
    D.fld({id:'f5n-no-'+k,label:'درخواست نمبر',ltr:true,w:'w-l',value:n.application_number,ph:'1234/IGP/2026',attrs:'data-field="application_number"'}),
    D.fld({id:'f5n-de-'+k,label:'افسر بالا کا عہدہ',type:'sel',w:'w-l',value:desigVal,opts:[['','— منتخب کریں —']].concat(FIVEC_DESIGNATIONS.map(d=>[d,d==='Other'?'دیگر':d])),attrs:'data-field="senior_officer_designation" onchange="handleDesig5C(this)"'}),
    D.fld({id:'f5n-dc-'+k,label:'عہدہ لکھیں',w:'w-m',value:isOther&&n.senior_officer_designation!=='Other'?n.senior_officer_designation:'',ph:'عہدہ',attrs:'data-field="senior_officer_designation_custom"'}).replace('class="dio-f ','class="dio-f f5c-dc'+(isOther?'':' f5c-hide')+' '),
    D.fld({id:'f5n-nm-'+k,label:'افسر کا نام',w:'w-m',grow:true,value:isOther?'':n.senior_officer_name,ph:'اختیاری',attrs:'data-field="senior_officer_name"'}),
    D.fld({id:'f5n-dt-'+k,label:'تاریخ ارسال',type:'date',value:n.forwarded_date,attrs:'data-field="forwarded_date"'}),
    `<button title="یہ نمبر ہٹائیں" aria-label="یہ نمبر ہٹائیں" class="btn btn-danger btn-sm" type="button" style="align-self:center;" onclick="this.closest('.f5c-num-row').remove()">✕</button>`
  ])+`</div>`;
}
function handleDesig5C(sel){const row=sel.closest('.f5c-num-row');const box=row&&row.querySelector('.f5c-dc');if(box){box.classList.toggle('f5c-hide',sel.value!=='Other');if(sel.value!=='Other'){const c=box.querySelector('[data-field="senior_officer_designation_custom"]');if(c)c.value='';}}}
function add5CNumberRow(){const c=document.getElementById('f5c-numbers');const tmp=document.createElement('div');tmp.innerHTML=render5CNumberRow({});c.appendChild(tmp.firstElementChild);}
function render5CAttachmentRow(a){const ic=a.category==='application_scan'?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/></svg>':a.category==='response_scan'?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>':'📎';const lb=a.category==='application_scan'?'Application Scan':a.category==='response_scan'?'Response Scan':'Other';const sz=a.file_size?` · ${(a.file_size/1024).toFixed(1)}KB`:'';return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;margin-bottom:6px;"><span style="font-size:18px;">${ic}</span><span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;">${esc5C(a.file_name)} <span style="color:var(--text-muted);font-size:10px;">(${lb}${sz})</span></span><button title="دیکھیں" aria-label="دیکھیں" class="btn btn-secondary btn-sm" onclick="view5CAttachment('${a.storage_path}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button><button title="حذف" aria-label="حذف" class="btn btn-danger btn-sm" onclick="delete5CAttachment('${a.id}','${a.storage_path}',this)"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button></div>`;}
async function upload5CFile(appId,category,file){if(!file)return;if(file.size>10*1024*1024){showToast('File too large (max 10 MB).','error');return;}showToast('Uploading...','info');try{await uploadAttachment5C(appId,file,category);showToast('Uploaded!','success');open5CForm(appId);}catch(e){showToast('Upload failed: '+e.message,'error',5000);}}
async function view5CAttachment(path){
  const url = await getAttachmentUrl5C(path);
  if (!url) { showToast('فائل نہیں ملی', 'error'); return; }
  // App ke ANDAR kholo — nayi tab mein data: URL Chrome block karta hai (khali safha)
  if (typeof _dioViewFile === 'function') _dioViewFile(url, path.split('/').pop() || 'فائل');
  else window.open(url, '_blank');
}
async function delete5CAttachment(id,path,btn){if(!confirm('Delete this attachment?'))return;try{await deleteAttachment5C(id,path);if(btn&&btn.closest('div'))btn.closest('div').remove();showToast('Deleted','info');}catch(e){dioWriteFail('منسلکہ',e,'حذف نہیں ہوئی');}}
async function save5CApp(id){
  const main={complainant_name:(window.DIOCard?DIOCard.readName('f5c-name'):document.getElementById('f5c-name').value.trim())||null,complainant_cnic:document.getElementById('f5c-cnic').value.trim()||null,complainant_cell:document.getElementById('f5c-cell').value.trim()||null,application_date:toISODate(document.getElementById('f5c-appdate').value)||null,status:document.getElementById('f5c-status').value};
  const numbers=Array.from(document.querySelectorAll('.f5c-num-row')).map(row=>{const r={};row.querySelectorAll('[data-field]').forEach(el=>{r[el.dataset.field]=el.value.trim()||null;});if(r.senior_officer_designation==='Other'){const c=row.querySelector('[data-field="senior_officer_designation_custom"]');r.senior_officer_designation=c&&c.value.trim()?c.value.trim():'Other';}if(r.forwarded_date)r.forwarded_date=toISODate(r.forwarded_date)||r.forwarded_date;delete r.senior_officer_designation_custom;return r;}).filter(n=>n.application_number);
  // متعلقہ مقدمہ (اختیاری) — sql/102 کے نئے خانے
  const cs=window.DIOCard?DIOCard.readCase():null;
  main.case_id=cs?cs.id:null; main.fir_number=cs?(cs.fir||null):null;
  const run=async(m)=>{if(id){await updateApplication5C(id,m,numbers);showToast('محفوظ ہو گیا','success');}else{await addApplication5C({...m,numbers});showToast('درخواست محفوظ ہو گئی','success');}};
  try{
    try{await run(main);}
    catch(e1){
      // sql/102 ابھی نہ چلی ہو تو مقدمے کے بغیر محفوظ کرو اور بتاؤ
      if(window.DIOCard&&DIOCard._missingCol(e1)){const m2={...main};delete m2.case_id;delete m2.fir_number;await run(m2);showToast('محفوظ ہو گیا، مگر مقدمے سے جوڑنے کے لیے ڈیٹابیس اپڈیٹ (sql/102) ابھی نہیں چلی','info',7000);}
      else throw e1;
    }
    closeModal();if(_f5cOnListPage())renderFiveC(document.getElementById('page-content'));_f5cAfterChange();}catch(e){
    // v547: درخواست بن گئی مگر نمبر رہ گئے — کارڈ بند کرو (دوبارہ «محفوظ» = دوہری درخواست) اور صاف بتاؤ
    if(e&&e.code==='DIO_5C_NUMBERS'){closeModal();if(_f5cOnListPage())renderFiveC(document.getElementById('page-content'));_f5cAfterChange();showToast('⚠ '+e.message,'error',10000);return;}
    dioWriteFail('درخواست',e,'محفوظ نہیں ہوئی');}
}
function confirmDelete5C(id,sn){if(!confirm(`Delete Application #${sn} and ALL its attachments?`))return;deleteApplication5C(id).then(()=>{showToast('حذف ہو گئی','info');if(_f5cOnListPage())renderFiveC(document.getElementById('page-content'));_f5cAfterChange();}).catch(e=>dioWriteFail('درخواست',e,'حذف نہیں ہوئی'));}

// ── RESPONSE WRITER ──
// Saved selection — restored after clicking toolbar selects so text stays highlighted
async function open5CResponse(id){
  const app=await getApplication5C(id);if(!app){showToast('Not found','error');return;}
  const o=currentOfficer||{};
  const today=formatDate(new Date());
  // Only pull application numbers — no officer rank or designation
  const refs=(app.application_5c_numbers||[]).map(n=>esc5C((n.application_number||'').replace(/،/g,'/'))).filter(Boolean).join('، ')||'—';

  // Initial content — uses <br> for spacing (not margin-bottom which propagates on Enter)
  // Layout strictly per approved reference format:
  // flex rows keep right & left items perfectly aligned on both lines,
  // application number + CNIC + cell render LTR, جواب درخواست centered/underlined,
  // signature block bottom-LEFT: line → SHO تھانہ → date (nothing else).
  const initial=app.response_text||`<div dir="rtl" style="display:flex;justify-content:space-between;align-items:baseline;"><span>تھانہ: ${esc5C(o.station||'')}</span><span>ضلع: ${esc5C(o.district||'')}</span></div>
<br>
<div dir="rtl" style="display:flex;justify-content:space-between;align-items:baseline;"><span>درخواست نمبری:</span><span dir="ltr" style="direction:ltr;unicode-bidi:isolate;">${refs}</span></div>
<br>
<div dir="rtl">درخواست ازاں: ${esc5C(app.complainant_name||'')}</div>
<br>
<div dir="rtl" style="display:flex;justify-content:space-between;align-items:baseline;"><span>شناختی کارڈ نمبر: <span dir="ltr" style="direction:ltr;unicode-bidi:isolate;">${esc5C(formatCNIC(app.complainant_cnic)||'')}</span></span><span>رابطہ نمبر: <span dir="ltr" style="direction:ltr;unicode-bidi:isolate;">${esc5C(formatCell(app.complainant_cell)||'')}</span></span></div>
<br>
<div dir="rtl" style="text-align:center;"><span style="font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;">جواب درخواست</span></div>
<br>
<div dir="rtl">جنابِ عالیٰ!</div>
<br>
<div dir="rtl"></div>
<br><br><br><br><br>
<div style="display:flex;justify-content:flex-start;direction:ltr;">
  <div style="text-align:center;min-width:200px;">
    <div style="border-top:1px solid #333;padding-top:6px;margin-top:50px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;font-weight:bold;text-align:center;">
      ${esc5C((typeof getSHOSignLine==='function') ? getSHOSignLine(o.station||'صدر ملتان') : '')}
    </div>
    <div style="font-size:11px;color:#555;margin:0;text-align:center;direction:ltr;">${today}</div>
  </div>
</div>`;


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
    /* PERMANENT RULE: only the working document prints — title bar and
       MS-Word-style toolbar must NEVER appear in print (real MS Word behaviour).
       Scoped via body.r5c-open so it can NEVER affect printing anywhere else
       in the app (misal docs, index, reports sab iframe se print hote hain). */
    @media print{
      body.r5c-open > *:not(#response5c-overlay){display:none!important;}
      body.r5c-open #response5c-overlay{position:static!important;background:white!important;display:block!important;}
      body.r5c-open #r5c-titlebar, body.r5c-open #response5c-overlay .wb-ribbon{display:none!important;}
      body.r5c-open #response5c-overlay > div:last-of-type{padding:0!important;background:white!important;display:block!important;}
      body.r5c-open #a4-paper{border:none!important;background-image:none!important;box-shadow:none!important;padding:0!important;min-height:auto!important;width:auto!important;max-width:none!important;}
    }
  </style>
  <!-- Title bar -->
  <div id="r5c-titlebar" style="background:#0f1923;padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #1a3148;flex-wrap:wrap;">
    <span style="font-weight:700;color:#e8f0fe;flex:1;font-size:13px;">Response — App #${app.serial_number} · ${esc5C(app.complainant_name||'')}</span>
    <button class="btn btn-primary btn-sm" onmousedown="event.preventDefault()" onclick="save5CResponse('${id}')">محفوظ کریں</button>
    <button class="btn btn-secondary btn-sm" onmousedown="event.preventDefault()" onclick="downloadResponse5C('${id}','${esc5C((app.complainant_name||'response').replace(/[^\w]/g,'_'))}')">ڈاؤن لوڈ</button>
    <button class="btn btn-secondary btn-sm" onmousedown="event.preventDefault()" onclick="print5CResponse()">پرنٹ</button>
    <button class="btn btn-secondary btn-sm" onmousedown="event.preventDefault()" onclick="dioSharePrint(()=>print5CResponse(),'جواب 5C')" title="شیئر — PDF / Word">شیئر</button>
    <button class="btn btn-danger btn-sm" onclick="document.body.classList.remove('r5c-open');document.getElementById('response5c-overlay').remove()">بند کریں</button>
  </div>
  ${buildWordToolbar('a4-paper', { preserveSel: true })}
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
             background-color:white;">${(window.DIO&&DIO.html&&DIO.html.safe)?DIO.html.safe(initial):esc5C(initial)}</div>
  </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('r5c-open');

  setTimeout(()=>{
    const paper=document.getElementById('a4-paper');
    if(!paper)return;
    paper.focus();
    setupWordToolbar('a4-paper');
    // Native Enter → <br> (not <div>). This prevents Nastaleeq font's
    // large block-level spacing AND fixes RTL cursor placement — Chrome
    // handles cursor position correctly when Enter is native, not intercepted.
    document.execCommand('defaultParagraphSeparator',false,'br');

    // v563: Tab (1.27 سینٹی میٹر) اور باقی MS Word کلیدیں — پورے سسٹم کا ایک ہی سننے والا (dio-keys.js)
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
      }catch(_){ /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    });
  },80);
}

// ── EDITOR COMMANDS ──
async function save5CResponse(id){
  const html=document.getElementById('a4-paper').innerHTML;
  try{
    dioWriteOk(await supabaseClient.from('applications_5c').update({response_text:((window.DIO&&DIO.html&&DIO.html.safe)?DIO.html.safe(html):html),response_date:new Date().toISOString().split('T')[0],status:'responded'}).eq('id',id).select('id'),'5-C response',true);
    showToast('Response saved online','success');
  }catch(e){dioWriteFail('جواب',e,'محفوظ نہیں ہوا');}
}

function downloadResponse5C(id,name){
  const html=document.getElementById('a4-paper').innerHTML;
  const lh=document.getElementById('a4-paper')?.style.lineHeight||'1.5';
  const full=`<!DOCTYPE html><html lang="ur"><head><meta charset="utf-8"><title>5-C Response</title><link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:20mm 18mm 20mm 15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Aptos,serif;font-size:14pt;line-height:${lh};word-spacing:3px;direction:rtl;margin:0;padding:0;color:#000;}div,p,li{margin:0;padding:0;}</style></head><body>${html}</body></html>`;
  const blob=new Blob([full],{type:'text/html;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`5C_${name}_${id.slice(0,8)}.html`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('Offline copy downloaded','success');
}

// Fix: @page margin:0 pushes Chrome's timestamp/URL off the page.
// Body padding replaces it so content has proper A4 white space.
function print5CResponse(){
  const html=document.getElementById('a4-paper').innerHTML;
  const lh=document.getElementById('a4-paper')?.style.lineHeight||'1.5';
  const _printHTML = (`<!DOCTYPE html>
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
<body>${html}</body>
</html>`);
  dioPrint(_printHTML);
}

// ── 5-C PRINT ────────────────────────────────────────────────
// ── 5-C PDF EXPORT (court-ready) ──────────────────────────────
async function _export5CPdf(id) {
  showToast('PDF تیار ہو رہا ہے — پرنٹ ونڈو میں "Save as PDF" منتخب کریں', 'info', 5000);
  // Reuse the same court-ready layout; browser's print dialog → Save as PDF
  setTimeout(() => _print5C(id), 600);
}

async function _print5C(id) {
  try {
    const { data: a } = await supabaseClient.from('applications_5c')
      .select('*, application_5c_numbers(*)').eq('id',id).single();
    if (!a) { showToast('درخواست نہیں ملی','error'); return; }
    const o = currentOfficer || {};
    const nums = (a.application_5c_numbers||[]);
    let _printHTML = '';
    _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{margin:15mm;size:A4;}
      body{font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',Arial,sans-serif;direction:rtl;color:#111;font-size:13px;}
      .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;}
      table{width:100%;border-collapse:collapse;margin-bottom:10px;}
      td,th{border:1px solid #333;padding:6px 10px;font-size:13px;}
      th{background:#f0f0f0;width:35%;}
      .resp{border:1px solid #ccc;padding:12px;min-height:80px;margin-top:8px;line-height:2;}
      .footer{font-size:10px;color:#666;text-align:left;margin-top:20px;border-top:1px solid #ccc;padding-top:6px;direction:ltr;}
      .sig{display:flex;justify-content:space-between;margin-top:30px;}
      .sig-box{text-align:center;min-width:180px;}
      .sig-line{border-top:1px solid #000;padding-top:5px;margin-top:25px;}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-weight:700;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;">
      <div>تھانہ ${esc5C(o.station||'—')}:</div>
      <div>ضلع ${esc5C(o.district||'—')}</div>
    </div>
    <table>
      <tr><th>مدعی / درخواست گزار</th><td><b>${esc5C(a.complainant_name)||'—'}</b></td></tr>
      <tr><th>درخواست نمبر</th><td><span dir="ltr" style="direction:ltr;unicode-bidi:isolate;display:inline-block;">${esc5C(nums.map(n=>(n.application_number||'').replace(/،/g,'/')).filter(Boolean).join('، '))||'—'}</span></td></tr>
      ${a.subject?`<tr><th>موضوع</th><td>${esc5C(a.subject)}</td></tr>`:''}
    </table>
    <div style="font-weight:700;margin-top:10px;">جواب / رپورٹ:</div>
    <div class="resp">${((window.DIO&&DIO.html&&DIO.html.safe)?DIO.html.safe(String(a.response_text||'').replace(/\n/g,'<br>')):esc5C(a.response_text||'')) || '&nbsp;'}</div>
    <div style="display:flex;justify-content:flex-start;direction:ltr;margin-top:30px;">
      <div style="text-align:center;min-width:200px;">
        <div style="border-top:1px solid #000;padding-top:6px;margin-top:35px;font-weight:700;direction:rtl;text-align:center;">
          ${esc5C((typeof getSHOSignLine==='function') ? getSHOSignLine(o.station||'') : '')}
        </div>
        <div style="font-size:11px;margin:0;text-align:center;direction:ltr;">${formatDate(new Date())}</div>
      </div>
    </div>
    <div class="footer">Digital IO</div>
    
    </body></html>`);
    dioPrint(_printHTML);
  } catch(e) { showToast(''+e.message,'error'); }
}

/* ═══════════════════════════════════════════════════════════
   5-C درخواست ↔ مقدمہ (v557)
   • 5-C درخواست میں «متعلقہ مقدمہ» چنا جائے تو وہ مقدمے کے اندر بھی
     نظر آتی ہے: مقدمے کی chip پٹی میں «5-C درخواستیں (n)» — صرف اُس
     مقدمے میں جس سے کوئی درخواست جڑی ہو (کراس ورژن والا اصول)۔
   • chip دبانے پر پورے صفحے میں اسی مقدمے کی درخواستوں کی فہرست —
     وہی بٹن جو 5-C صفحے پر ہیں (ترمیم، فائل، جواب، پرنٹ، PDF، شیئر، حذف)
     اور «+ 5-C درخواست درج کریں» (یہ مقدمہ پہلے سے منتخب)۔
   • جوڑ صرف case_id سے (sql/102)؛ ڈیٹا وہی ایک — 5-C صفحے اور مقدمے
     میں دو نقلیں نہیں۔ آف لائن بھی (fivec_cache میں case_id ہوتا ہے)۔
   ═══════════════════════════════════════════════════════════ */
// 5-C کا اپنا صفحہ کھلا ہے (مقدمے کے اندر نہیں)
function _f5cOnListPage(){ return window._activePage==='fivec' && !window._inWorkspace; }

async function _f5cForCase(caseId){
  if(!caseId) return [];
  const all=await getApplications5C('');
  return (all||[]).filter(a=>a&&a.case_id!=null&&String(a.case_id)===String(caseId));
}

// مقدمے کی chip پٹی میں جگہ (#f5c-case-chip) بھرو — درخواست نہ ہو تو خالی
async function _f5cFillChip(caseId){
  const slot=document.getElementById('f5c-case-chip');
  if(!slot) return;
  let list=[];
  try{ list=await _f5cForCase(caseId); }catch(_){ list=[]; }
  const now=document.getElementById('f5c-case-chip');
  if(!now || String(now.dataset.case)!==String(caseId)) return;   // اتنے میں مقدمہ بدل گیا
  now.innerHTML=list.length
    ? `<span class="mdoc-chip mdoc-done" onclick="open5CCaseList()" title="اس مقدمے سے متعلق 5-C درخواستیں">`+
      `<bdi dir="ltr">5-C</bdi> درخواستیں (${list.length})</span>`
    : '';
}
window._f5cFillChip=_f5cFillChip;

function _f5cCaseId(){
  return (typeof _misalCaseId!=='undefined'&&_misalCaseId) || (typeof currentCaseId!=='undefined'?currentCaseId:null);
}

// مقدمے کے اندر: اسی مقدمے کی 5-C درخواستیں (پورا صفحہ)
async function open5CCaseList(){
  const caseId=_f5cCaseId();
  if(!caseId) return;
  if(typeof _dioOpenDocTab==='function') _dioOpenDocTab('fivec_case');
  await _f5cRenderCaseList(caseId);
}
window.open5CCaseList=open5CCaseList;

async function _f5cRenderCaseList(caseId){
  const area=document.getElementById('workspace-editor-area')||document.getElementById('workspace-tab-content');
  if(!area) return;
  const list=await _f5cForCase(caseId);
  const c=(typeof _misalCase!=='undefined'&&_misalCase)||window._workspaceCase||{};
  const fir=esc5C(c.fir_number||'');
  area.innerHTML=`
  <div id="f5c-case-view" style="direction:rtl;height:100%;overflow-y:auto;padding:10px;box-sizing:border-box;">
    <div style="position:relative;min-height:38px;display:flex;align-items:center;justify-content:center;border-bottom:2px solid var(--accent);padding-bottom:6px;margin-bottom:12px;">
      <div class="dio-hs1" style="font-weight:800;color:var(--accent);text-align:center;"><bdi dir="ltr">5-C</bdi> درخواستیں — مقدمہ <bdi dir="ltr">${fir||'—'}</bdi></div>
      <button class="btn btn-primary btn-sm dio-add-btn" style="position:absolute;right:0;top:50%;transform:translateY(-50%);" onclick="open5CForm(null,{caseId:'${esc5C(String(caseId))}'})">+ <bdi dir="ltr">5-C</bdi> درخواست درج کریں</button>
    </div>
    ${list.length?`<div style="overflow-x:auto;"><table class="data-table fivec-center-table" style="width:100%;">
      <thead><tr><th>#</th><th>درخواست دہندہ</th><th>شناختی کارڈ</th><th>موبائل</th><th>درخواست نمبر</th><th>تاریخ</th><th>صورتحال</th><th>فائلیں</th><th></th></tr></thead>
      <tbody id="f5c-case-rows">${list.map(render5CRow).join('')}</tbody></table></div>`
    :`<div id="f5c-case-rows" style="text-align:center;padding:36px 12px;color:var(--text-muted);">اس مقدمے سے کوئی <bdi dir="ltr">5-C</bdi> درخواست متعلق نہیں۔</div>`}
  </div>`;
  // موبائل: 5-C صفحے کی طرح جدول کی جگہ کارڈ (ہر خانے پر اُس کا عنوان)
  try{ if(window.dioMobile&&dioMobile.isMobile()) dioMobile.labelTables(area); }catch(_){ /* صرف شکل — نہ ہو سکے تو جدول ہی */ }
}

// درخواست محفوظ / حذف ہونے کے بعد: کھلے مقدمے کی chip اور فہرست تازہ
function _f5cAfterChange(){
  const caseId=_f5cCaseId();
  if(!window._inWorkspace||!caseId) return;
  try{ _f5cFillChip(caseId); }catch(_){ /* chip نہ ہو تو کچھ نہیں */ }
  if(document.getElementById('f5c-case-view')) _f5cRenderCaseList(caseId);
}
window._f5cAfterChange=_f5cAfterChange;
