/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — OFFICIAL DOCUMENT GENERATION
   Fills real government .docx templates with case data and
   downloads print-ready Word files. Used by Case Workspace.
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════
//  OFFICIAL DOCUMENT GENERATION (exact govt format)
//  Loads the real .docx template, fills the {tokens}
//  with case data, downloads a print-ready Word file.
// ═══════════════════════════════════════════════════
const OFFICIAL_TEMPLATES = {
  'CDR Form':           'CDR_Form_TEMPLATE.docx',
  'Zimni Berooni':      'Zimni_Berooni_TEMPLATE.docx',
  'Zimni Androoni':     'Zimni_Androoni_TEMPLATE.docx',
  'Investigation Bills':'Investigation_Bill_TEMPLATE.docx',
};

let _docxLibsReady = false;
function _loadScriptOnce(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Failed to load '+src));document.head.appendChild(s);});}
function loadDocxLibs(){
  return new Promise((resolve,reject)=>{
    if(_docxLibsReady && window.PizZip && window.docxtemplater){resolve();return;}
    _loadScriptOnce('https://cdn.jsdelivr.net/npm/pizzip@3.1.6/dist/pizzip.min.js')
      .then(()=>_loadScriptOnce('https://cdn.jsdelivr.net/npm/docxtemplater@3.50.0/build/docxtemplater.js'))
      .then(()=>{_docxLibsReady=true;resolve();})
      .catch(()=>{ // fallback CDN
        _loadScriptOnce('https://unpkg.com/pizzip@3.1.6/dist/pizzip.min.js')
          .then(()=>_loadScriptOnce('https://unpkg.com/docxtemplater@3.50.0/build/docxtemplater.js'))
          .then(()=>{_docxLibsReady=true;resolve();})
          .catch(reject);
      });
  });
}

function buildOfficialDocData(c){
  const o = currentOfficer || {};
  const today = new Date();
  const monthsUr = ['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];
  return {
    station: o.station || '',
    district: o.district || '',
    fir_number: c.fir_number || '',
    fir_date: c.fir_date || '',
    offence: c.offence_type || '',
    occurrence_date: c.occurrence_date || '',
    occurrence_place: c.occurrence_place || '',
    io_name: o.full_name || '',
    io_mobile: o.phone || '',
    accused_name: c.accused_name || '',
    diary_no: '',
    diary_date: '',
    zimni_no: '',
    year: String(today.getFullYear()),
    month: monthsUr[today.getMonth()],
  };
}

async function generateOfficialDoc(docName){
  const tplFile = OFFICIAL_TEMPLATES[docName];
  if(!tplFile){ showToast('⚠️ No official template available for this document.','error'); return; }
  const c = window._workspaceCase;
  if(!c){ showToast('⚠️ Please open a case first.','error'); return; }
  showToast('⏳ Generating official document…','info');
  try{
    await loadDocxLibs();
    const resp = await fetch('templates/' + tplFile);
    if(!resp.ok) throw new Error('Template not found at templates/'+tplFile+' (HTTP '+resp.status+'). Did you upload the templates folder?');
    const buf = await resp.arrayBuffer();
    const zip = new window.PizZip(buf);
    const doc = new window.docxtemplater(zip, { paragraphLoop:true, linebreaks:true, nullGetter:()=>'' });
    doc.render(buildOfficialDocData(c));
    const blob = doc.getZip().generate({ type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const safeFir = (c.fir_number||'').replace(/[\/\\:*?"<>|]/g,'-');
    const fname = docName.replace(/\s+/g,'_') + '_FIR_' + safeFir + '.docx';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    showToast('✅ Official document downloaded — open it in Word/Google Docs to print.','success',5000);
  }catch(err){
    console.error('[Official Doc Error]', err);
    showToast('❌ '+err.message,'error',7000);
  }
}
