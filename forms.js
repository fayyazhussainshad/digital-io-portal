/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — OFFICIAL FORMS TAB
   Government-approved templates auto-filled with case data.
   Requires: PizZip, docxtemplater, FileSaver (loaded in head).
   Loaded after app-core.js.
   ═══════════════════════════════════════════════════════════ */

// ── OFFICIAL FORMS (Government Templates — Auto-Fill) ──
const OFFICIAL_FORMS=[
  {id:'cdr',name:'CDR Form — کال ڈیٹا ریکارڈ',file:'CDR_Form_template.docx',type:'docx'},
  {id:'berooni',name:'Zimni Berooni — بیرونی ضمنی',file:'Zimni_Berooni_template.docx',type:'docx'},
  {id:'bill',name:'Investigation Bill — بل تفتیش',file:'Investigation_Bill_template.docx',type:'docx'},
  {id:'androoni',name:'Zimni Androoni — اندرونی ضمنی (blank note form)',file:'Zimni_Androoni.docx',type:'docx-blank'},
  {id:'cro',name:'CRO Form — کریمنل ریکارڈ کارڈ (print &amp; fill by hand)',file:'CRO_FORM.pdf',type:'pdf-blank'},
];
function buildFormData(c){
  const o=currentOfficer||{};const now=new Date();
  const months=['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];
  return{
    station:o.station||'',district:o.district||'',
    firNumber:c?.fir_number||'',firDate:c?.fir_date||'',
    offence:[c?.section_of_law,c?.offence_type].filter(Boolean).join(' — ')||'',
    occurrenceDate:c?.occurrence_date||'',occurrencePlace:'',
    ioName:o.full_name||'',ioMobile:o.phone||'',
    year:String(now.getFullYear()),billMonth:months[now.getMonth()],billYear:String(now.getFullYear()),
  };
}
async function generateOfficialForm(formId){
  const form=OFFICIAL_FORMS.find(f=>f.id===formId);if(!form)return;
  const caseId=document.getElementById('offform-case-select')?.value;
  if(form.type==='pdf-blank'){window.open('templates/'+form.file,'_blank');showToast('🖨️ CRO form opened — print and fill by hand (fingerprints & physical marks require the person present).','info',6000);return;}
  if(form.type==='docx-blank'){const a=document.createElement('a');a.href='templates/'+form.file;a.download=form.file;document.body.appendChild(a);a.click();a.remove();showToast('📄 Blank form downloaded.','info');return;}
  if(typeof PizZip==='undefined'||typeof window.docxtemplater==='undefined'){showToast('⚠️ Document library still loading — wait a moment and try again.','error',4000);return;}
  let caseData=null;if(caseId){try{caseData=await getCase(caseId);}catch(e){}}
  const data=buildFormData(caseData);
  try{
    const resp=await fetch('templates/'+form.file);
    if(!resp.ok)throw new Error('Template not found. Make sure '+form.file+' is in the /templates/ folder of your site.');
    const buf=await resp.arrayBuffer();
    const zip=new PizZip(buf);
    const doc=new window.docxtemplater(zip,{paragraphLoop:true,linebreaks:true,delimiters:{start:'{',end:'}'}});
    doc.render(data);
    const out=doc.getZip().generate({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    const fname=form.id+'_'+(data.firNumber||'blank').replace(/[^\w]/g,'-')+'.docx';
    saveAs(out,fname);
    showToast('✅ Official form generated & downloaded!','success');
  }catch(e){showToast('❌ Generation failed: '+e.message,'error',6000);}
}
registerPage('forms',renderOfficialForms);
async function renderOfficialForms(container){
  const cases=await getCases();
  container.innerHTML=`<div class="page-header"><div><div class="page-title">📥 Official Forms</div><div class="page-subtitle">Government-approved templates, auto-filled from case data</div></div></div>`
  +`<div class="card" style="margin-bottom:16px;"><div class="card-title">1️⃣ Select Case <span style="font-weight:400;color:var(--text-muted);">(optional — fills FIR number, date, offence, etc.)</span></div>`
  +`<select class="filter-select" id="offform-case-select" style="width:100%;max-width:420px;"><option value="">— Blank form (no case data) —</option>`
  +cases.map(c=>`<option value="${c.id}">${c.fir_number||'(no FIR)'} — ${c.complainant||c.accused_name||''}</option>`).join('')
  +`</select></div>`
  +`<div class="card"><div class="card-title">2️⃣ Choose a Form to Generate</div>`
  +OFFICIAL_FORMS.map(f=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 8px;border-bottom:1px solid var(--border-light);"><div style="font-size:13px;color:var(--text-secondary);">📄 ${f.name}</div><button class="btn btn-primary btn-sm" style="white-space:nowrap;flex-shrink:0;" onclick="generateOfficialForm('${f.id}')">${f.type==='docx'?'⬇️ Generate Filled':f.type==='pdf-blank'?'🖨️ Open to Print':'⬇️ Download Blank'}</button></div>`).join('')
  +`</div>`
  +`<div style="margin-top:14px;padding:14px;background:var(--bg-tertiary);border-radius:8px;font-size:11px;color:var(--text-muted);line-height:1.8;">ℹ️ <b>How it works:</b> Generated forms keep the <b>exact</b> government format. Pick a case, click "Generate Filled" — the FIR number, date, offence, station, and your name are inserted automatically into the official Word file. Open the download to review, then print.<br>🖐️ <b>CRO Form</b> is a scanned card (fingerprints + physical marks) — print blank and fill by hand.<br>📝 <b>Zimni Androoni</b> is an internal note form filled by hand.</div>`;
}

