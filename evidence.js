/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — EVIDENCE TAB
   Attach photos, video, audio and documents to cases.
   Live camera capture, file select, print selected.
   ═══════════════════════════════════════════════════════════ */

// ── EVIDENCE ──
registerPage('evidence',renderEvidence);
async function renderEvidence(container){const all=await getEvidence();container.innerHTML=`<div class="page-header"><button class="btn btn-primary dio-add-btn" onclick="openAddEvidenceModal()">+ شہادت درج کریں</button><div><div class="page-title">شہادتیں و میڈیا</div><div class="page-subtitle">${all.length} اشیاء</div></div><div style="display:flex;gap:8px;margin-inline-start:auto;"><button class="btn btn-secondary btn-sm" onclick="selectAllEvidence()">سب منتخب</button><button class="btn btn-secondary btn-sm" onclick="printSelectedEvidence()">منتخب چھاپیں</button><button class="btn btn-secondary btn-sm" onclick="dioSharePrint(()=>printSelectedEvidence(),'شہادتیں')" title="منتخب شہادتیں شیئر — PDF / Word">منتخب شیئر</button></div></div><div class="evidence-grid" id="evidence-grid">${all.length===0?`<div style="grid-column:1/-1;">${(window.DIO && DIO.states) ? DIO.states.empty('doc','ابھی کوئی شہادت نہیں','تصویر، ویڈیو، آواز یا دستاویز مقدمے کے ساتھ لگائیں') : '<div style="text-align:center;color:var(--text-muted);padding:40px;">کوئی شہادت نہیں</div>'}</div>`:all.map(e=>`<div class="evidence-card" id="ev-card-${e.id}"><div class="evidence-thumb" style="position:relative;">${(e.storage_path||e.file_url||e._viewUrl)?`<img src="${esc(e._viewUrl||e.file_url||'')}" style="width:100%;height:100%;object-fit:cover;" alt="">`:`<span>${e.type==='Photo'?"<svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.45'><path d='M3.5 8h3.2l1.6-2.4h7.4L17.3 8h3.2v11.5h-17z'/><circle cx='12' cy='13.5' r='3.6'/></svg>":e.type==='Video'?"<svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.45'><path d='M3.5 6.5h11v11h-11z'/><path d='M14.5 10.5l6-3v9l-6-3z'/></svg>":e.type==='Audio'?"<svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.45'><rect x='9' y='3' width='6' height='11' rx='3'/><path d='M5 11a7 7 0 0 0 14 0'/><path d='M12 18v3'/></svg>":"<svg viewBox='0 0 24 24' width='34' height='34' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.45'><path d='M7 3h7l4 4v14H7z'/><path d='M14 3v5h5'/></svg>"}</span>`}<input type="checkbox" class="ev-select-cb" data-id="${e.id}" style="position:absolute;top:8px;left:8px;width:16px;height:16px;accent-color:var(--accent);"></div><div class="evidence-info" onclick="viewEvidenceDetail('${e.id}')"><div class="evidence-name">${esc(e.name)}</div><div class="evidence-tag">${esc(e.fir_number)||'—'}</div><div style="display:flex;justify-content:space-between;margin-top:4px;"><span style="font-size:10px;background:var(--hover-bg);color:var(--text-muted);padding:2px 6px;border-radius:4px;">${esc(e.type)}</span><span style="font-size:9px;color:var(--text-faint);">${esc(e.evidence_date||formatDate(e.created_at))}</span></div></div></div>`).join('')}</div>`;}
function selectAllEvidence(){document.querySelectorAll('.ev-select-cb').forEach(cb=>cb.checked=true);}
async function printSelectedEvidence(){const sel=[...document.querySelectorAll('.ev-select-cb:checked')].map(cb=>cb.dataset.id);if(!sel.length){showToast('کم از کم ایک شہادت منتخب کریں۔','error');return;}
  // CHAIN OF CUSTODY — record a print/export access for each item (Phase 4C)
  try {
    if (window.DIO && DIO.custody) {
      const all = await getEvidence();
      sel.forEach(sid => {
        const e = (all||[]).find(x=>x.id===sid);
        DIO.custody.record('printed', sid,
          { fir_number: e && e.fir_number, evidence_name: e && e.name, details: { batch: sel.length } });
      });
    }
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
  // v538: پہلے یہاں ایک غیر موجود فنکشن (printContent) تھا — بٹن کچھ نہیں کرتا تھا۔
  //   اب منتخب شہادتوں کا جدول، نظام کے اپنے dioPrint سے (Ctrl+P جیسا ہی)۔
  let _all = [];
  try { _all = (await getEvidence()) || []; } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  const _TYPE = { Photo:'تصویر', Video:'ویڈیو', Audio:'آواز', Document:'دستاویز' };
  const _rows = sel.map((sid, i) => {
    const e = _all.find(x => String(x.id) === String(sid)) || {};
    const d = e.evidence_date || e.created_at;
    return '<tr><td>' + (i + 1) + '</td><td>' + esc(e.name || '—') + '</td>'
      + '<td dir="ltr" style="unicode-bidi:isolate;">' + esc(e.fir_number || '—') + '</td>'
      + '<td>' + esc(_TYPE[e.type] || e.type || '—') + '</td>'
      + '<td dir="ltr" style="unicode-bidi:isolate;">' + (d ? esc(formatDate(d)) : '—') + '</td>'
      + '<td>' + esc(e.notes || '') + '</td></tr>';
  }).join('');
  const _o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  const _html = '<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title>شہادتوں کی رپورٹ</title>'
    + (typeof dioFontHead === 'function' ? dioFontHead() : '')
    + '<style>@page{size:A4;margin:15mm;}body{font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;direction:rtl;font-size:13pt;color:#111;}'
    + 'h2{text-align:center;font-size:20pt;margin:0 0 4px;}p.sub{text-align:center;margin:0 0 12px;font-size:11pt;}'
    + 'table{width:100%;border-collapse:collapse;}th,td{border:1px solid #555;padding:6px 8px;text-align:right;vertical-align:top;}'
    + 'th{background:#eee;font-weight:700;}</style></head><body>'
    + '<h2>شہادتوں کی رپورٹ</h2>'
    + '<p class="sub">' + esc(_o.full_name || '') + (_o.station ? ' · تھانہ ' + esc(_o.station) : '')
    + ' · تاریخ: <span dir="ltr" style="unicode-bidi:isolate;">' + esc(formatDate(new Date())) + '</span> · کل ' + sel.length + '</p>'
    + '<table><thead><tr><th>نمبر</th><th>نام</th><th>مقدمہ</th><th>قسم</th><th>تاریخ</th><th>تفصیل</th></tr></thead><tbody>'
    + _rows + '</tbody></table></body></html>';
  if (typeof dioPrint === 'function') dioPrint(_html);
  else showToast('پرنٹ دستیاب نہیں — صفحہ ریفریش کریں', 'error');
}
let cameraStream=null;
function openAddEvidenceModal(){if(window.DIOEntry&&window.DIOCard)return DIOEntry.evidence();window._evDataUrl=null;window._evFile=null;openModal('شہادت شامل کریں',`<div style="display:flex;gap:8px;margin-bottom:14px;"><button class="btn btn-secondary btn-sm" onclick="openCamera()">کیمرے سے</button><button class="btn btn-secondary btn-sm" onclick="openFileSelect()">فائل منتخب کریں</button></div><div id="camera-preview" style="display:none;margin-bottom:12px;"><video id="cam-video" style="width:100%;border-radius:8px;max-height:200px;" autoplay playsinline></video><div style="display:flex;gap:8px;margin-top:8px;"><button class="btn btn-primary btn-sm" onclick="snapPhoto()">تصویر لیں</button><button class="btn btn-secondary btn-sm" onclick="stopCamera()">بند کریں</button></div><canvas id="cam-canvas" style="display:none;"></canvas><img id="cam-snap" style="display:none;width:100%;border-radius:8px;margin-top:8px;border:2px solid var(--accent);" alt=""></div><div class="form-row"><div class="form-group"><label class="form-label">نام *</label><input class="form-input" id="ev-name" placeholder="شہادت کا نام"></div><div class="form-group"><label class="form-label">متعلقہ مقدمہ *</label><input class="form-input" id="ev-fir-link" placeholder="مثلاً 245/2025"></div></div><div class="form-row"><div class="form-group"><label class="form-label">قسم</label><select class="form-input" id="ev-type-input"><option value="Photo">تصویر</option><option value="Video">ویڈیو</option><option value="Audio">آواز</option><option value="Document">دستاویز</option></select></div><div class="form-group"><label class="form-label">تاریخ</label><input class="form-input" id="ev-date-input" placeholder="DD-MM-YYYY"></div></div><div class="form-group"><label class="form-label">تفصیل</label><textarea class="form-input" id="ev-notes-input" rows="2" placeholder="مختصر تفصیل…"></textarea></div>`,`<button class="btn btn-secondary" onclick="stopCamera();closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveEvidenceItem()">شامل کریں</button>`);}
function openCamera(){document.getElementById('camera-preview').style.display='block';navigator.mediaDevices?.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{cameraStream=stream;document.getElementById('cam-video').srcObject=stream;}).catch(()=>showToast('کیمرہ دستیاب نہیں۔','error'));}
function stopCamera(){cameraStream?.getTracks().forEach(t=>t.stop());cameraStream=null;}
function snapPhoto(){const v=document.getElementById('cam-video'),c=document.getElementById('cam-canvas'),s=document.getElementById('cam-snap');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);s.src=c.toDataURL('image/jpeg',0.9);window._evDataUrl=s.src;window._evFile=null;s.style.display='block';v.style.display='none';stopCamera();const ni=document.getElementById('ev-name');if(ni&&!ni.value)ni.value='کیمرے کی تصویر '+new Date().toLocaleString('en-GB');document.getElementById('ev-type-input').value='Photo';showToast('تصویر محفوظ ہو گئی۔','success');}
function openFileSelect(){const i=document.createElement('input');i.type='file';i.accept='image/*,video/*,audio/*,.pdf,.doc,.docx';i.onchange=e=>{const f=e.target.files[0];if(!f)return;window._evFile=f;window._evDataUrl=null;const ni=document.getElementById('ev-name');if(ni&&!ni.value)ni.value=f.name;const ti=document.getElementById('ev-type-input');if(ti){if(f.type.startsWith('image'))ti.value='Photo';else if(f.type.startsWith('video'))ti.value='Video';else if(f.type.startsWith('audio'))ti.value='Audio';else ti.value='Document';}showToast('فائل منتخب: '+f.name,'success');};i.click();}
async function saveEvidenceItem(){
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر نئی شہادت شامل کرنا بند
  if (window.DIO && DIO.sub && !DIO.sub.guard('شہادت شامل')) return;
  const name=document.getElementById('ev-name').value.trim(),fir=document.getElementById('ev-fir-link').value.trim();
  if(!name||!fir){showToast('Name and FIR are required.','error');return;}
  try{
    const evType = document.getElementById('ev-type-input').value;
    const evDate = document.getElementById('ev-date-input').value;
    const evNotes = document.getElementById('ev-notes-input').value;
    // Photo/file (camera dataURL ya select ki hui file) — ab ASAL mein upload/store hoti hai
    const _fileInfo = window._evDataUrl ? { dataUrl: window._evDataUrl }
                    : (window._evFile ? { file: window._evFile } : null);
    const _meta = { name, fir_number:fir, type:evType, evidence_date:evDate, notes:evNotes, is_readonly:true };
    const _row = (typeof addEvidenceWithFile === 'function')
      ? await addEvidenceWithFile(_meta, _fileInfo)
      : await addEvidence(_meta);
    window._evDataUrl = null; window._evFile = null;
    if (_row && _row._pendingUpload) showToast('آف لائن محفوظ — انٹرنیٹ آنے پر شہادت اپلوڈ ہو گی', 'info', 4000);
    // AUDIT — evidence.uploaded (Phase 4B)
    try {
      if (window.DIO && DIO.audit) DIO.audit.log('evidence.uploaded', 'evidence',
        (_row && _row.id) || null, {
        after: { name, fir_number: fir, type: evType, evidence_date: evDate },
        metadata: { has_notes: !!(evNotes && evNotes.length) }
      });
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    // CHAIN OF CUSTODY — created (Phase 4C)
    try {
      if (window.DIO && DIO.custody) DIO.custody.record('created', (_row && _row.id) || null,
        { fir_number: fir, evidence_name: name, details: { type: evType } });
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    stopCamera();closeModal();showToast('Evidence attached: '+name,'success');renderEvidence(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}
async function viewEvidenceDetail(id){
  const all=await getEvidence(),e=all.find(x=>x.id===id);if(!e)return;
  // CHAIN OF CUSTODY — record this access BEFORE fetching the chain,
  // so the officer's own view appears in the timeline they see.
  try {
    if (window.DIO && DIO.custody) await DIO.custody.record('viewed', id,
      { fir_number: e.fir_number, evidence_name: e.name });
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
  openModal('Evidence Details',
    `<div>${[['Name',e.name],['FIR',e.fir_number||'—'],['Type',e.type],['Date',e.evidence_date||'—'],['Notes',e.notes||'—']].map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${esc(v)}</span></div>`).join('')}</div>`+
    `<div style="text-align:center;padding:16px;font-size:48px;">${e.type==='Photo'?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M3.5 8h3.2l1.6-2.4h7.4L17.3 8h3.2v11.5h-17z"/><circle cx="12" cy="13.5" r="3.6"/></svg>':e.type==='Video'?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M3.5 6.5h11v11h-11z"/><path d="M14.5 10.5l6-3v9l-6-3z"/></svg>':e.type==='Audio'?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>':'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/></svg>'}</div>`+
    `<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:12px;direction:rtl;">
       <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px;">حفاظتی زنجیر (Chain of Custody)</div>
       <div id="ev-custody-chain"><div style="font-size:11px;color:var(--text-muted);">لوڈ ہو رہی ہے…</div></div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>${e._viewUrl&&window.DIOCard?`<button class="btn btn-primary btn-sm" onclick="DIOCard.viewer(window._evViewUrl,window._evViewName,'شہادت')">فائل دیکھیں</button>`:''}<button class="btn btn-danger btn-sm" onclick="closeModal();doDeleteEvidence('${id}')">حذف کریں</button>`);
  window._evViewUrl = e._viewUrl || null; window._evViewName = String(e.name || 'evidence');
  // Async-load the chain into the placeholder (never blocks the modal).
  try {
    if (window.DIO && DIO.custody) {
      const events = await DIO.custody.chain(id);
      const box = document.getElementById('ev-custody-chain');
      if (box) box.innerHTML = DIO.custody.renderChain(events);
    }
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
}
async function doDeleteEvidence(id){
  try{
    // AUDIT — "before" snapshot (Phase 4B). Delete se pehle capture.
    let _before = null;
    try {
      if (window.DIO && DIO.audit) {
        const all = await getEvidence();
        const e = (all||[]).find(x=>x.id===id);
        if (e) _before = { name: e.name, fir_number: e.fir_number, type: e.type, evidence_date: e.evidence_date };
      }
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    // CHAIN OF CUSTODY — record deletion BEFORE it happens. The custody
    // table has no FK to evidence, so this proof survives the delete.
    try {
      if (window.DIO && DIO.custody) await DIO.custody.record('deleted', id,
        { fir_number: _before && _before.fir_number, evidence_name: _before && _before.name,
          details: { type: _before && _before.type } });
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    await deleteEvidence(id);
    // AUDIT — evidence.deleted (critical — evidence tampering track)
    try {
      if (window.DIO && DIO.audit) DIO.audit.log('evidence.deleted', 'evidence', id, {
        before: _before
      });
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    showToast('Evidence deleted.');
    renderEvidence(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}


