/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — FIR / CROSS VERSION (متن + فوٹو کاپی)
   ═══════════════════════════════════════════════════════════ */

let _firCaseId = null;
let _firMatn = [];     // all fir_matn rows for this case
let _firCopies = [];   // all fir_copies rows for this case
// Entry point — type: 'fir' or 'cross_version'
async function openFirView(caseId, type) {
  _firCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadFir();
  _renderFir(type || 'fir');
}

async function _loadFir() {
  if (!navigator.onLine) {
    try { _firMatn = JSON.parse(localStorage.getItem('dio_firmatn_'+_firCaseId)||'[]'); } catch(_) { _firMatn=[]; }
    try { _firCopies = JSON.parse(localStorage.getItem('dio_fircopies_'+_firCaseId)||'[]'); } catch(_) { _firCopies=[]; }
    return;
  }
  try {
    const [m, c] = await Promise.all([
      supabaseClient.from('fir_matn').select('*').eq('case_id', _firCaseId).order('created_at',{ascending:true}),
      supabaseClient.from('fir_copies').select('*').eq('case_id', _firCaseId).order('created_at',{ascending:true}),
    ]);
    _firMatn = m.data || [];
    _firCopies = c.data || [];
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR matn: local save nakaam', _); }
    try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR copies: local save nakaam', _); }
  } catch(_) {
    try { _firMatn = JSON.parse(localStorage.getItem('dio_firmatn_'+_firCaseId)||'[]'); } catch(_2) { _firMatn=[]; }
    try { _firCopies = JSON.parse(localStorage.getItem('dio_fircopies_'+_firCaseId)||'[]'); } catch(_2) { _firCopies=[]; }
  }
}

// کیا اس مقدمہ میں کراس ورژن ہے؟ (نیا مقدمہ کارڈ میں کراس ورژن ✓ — یا پہلے سے کراس کا ڈیٹا موجود ہو)
function _firCaseHasCross() {
  const pool = [
    (typeof _misalCase !== 'undefined') ? _misalCase : null,
    window._workspaceCase || null,
    (typeof currentCase !== 'undefined') ? currentCase : null,
  ];
  const c = pool.find(x => x && x.id === _firCaseId) || null;
  if (c && typeof caseHasCross === 'function' && caseHasCross(c)) return true;
  return _firMatn.some(m => m.type === 'cross_version') || _firCopies.some(c2 => c2.type === 'cross_version');
}

// ایک حصے کی سرخی: بٹن دائیں کنارے کے ساتھ، سرخی صفحے کے بالکل درمیان
// (3 خانوں کا grid — دونوں طرف برابر چوڑائی، اس لیے سرخی ہمیشہ مرکز میں رہتی ہے)
function _firHeadRow(title, btnHtml, color, border, weight) {
  return `
    <div class="fir-headrow" style="border-bottom:${border};">
      <div class="fir-headrow-btn">${btnHtml}</div>
      <div class="dio-hs2 fir-headrow-title" style="font-weight:${weight};color:${color};">${title}</div>
      <div aria-hidden="true"></div>
    </div>`;
}

// ایک حصہ: متن + فوٹو کاپی (fir یا cross_version)
function _renderFirPart(type) {
  const isCross = type === 'cross_version';
  const heading = isCross ? 'کراس ورژن' : 'ایف آئی آر';
  const color = isCross ? 'var(--amber)' : 'var(--accent)';
  const matn = _firMatn.filter(m => (m.type||'fir') === type);
  const copies = _firCopies.filter(c => (c.type||'fir') === type);
  const inputId = 'fir-copy-input-' + type;
  return `
  <section class="fir-part" id="fir-part-${type}" data-type="${type}">
    <!-- متن -->
    ${_firHeadRow('متن ' + heading,
      `<button class="btn btn-primary btn-sm" onclick="_openMatnModal('${type}')">+ متن درج کریں</button>`,
      color, '2px solid ' + color, 800)}
    ${_renderMatnTable(matn)}

    <!-- فوٹو کاپی -->
    ${_firHeadRow('فوٹو کاپی ' + heading,
      `<button class="btn btn-secondary btn-sm" onclick="document.getElementById('${inputId}').click()">+ فوٹو کاپی اپلوڈ کریں</button>
       <input type="file" id="${inputId}" accept="image/*,application/pdf" style="display:none;" onchange="_uploadFirCopy(this,'${type}')">`,
      'var(--text-primary)', '1px solid var(--border)', 700)}
    ${_renderCopyTable(copies)}
  </section>`;
}

// متن والا صفحہ — دو حصے: (1) متن ایف آئی آر + فوٹو کاپی ایف آئی آر
//                        (2) متن کراس ورژن + فوٹو کاپی کراس ورژن
// focus: 'fir' یا 'cross_version' — صفحہ کھلنے پر وہی حصہ سامنے آئے
function _renderFir(focus) {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const oldWrap = document.getElementById('fir-page');
  const keepScroll = (oldWrap && area.contains(oldWrap)) ? oldWrap.scrollTop : null;
  const showCross = _firCaseHasCross();

  area.innerHTML = `
  <style>
    #fir-page { direction:rtl; height:100%; overflow-y:auto; padding:10px; width:100%; box-sizing:border-box; }
    #fir-page .fir-part { border:1px solid var(--border); border-radius:10px; padding:10px; background:var(--bg-card); }
    #fir-page .fir-part + .fir-part { margin-top:22px; }
    #fir-page .fir-headrow { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; column-gap:8px;
      padding-bottom:6px; margin:0 0 10px; }
    #fir-page .fir-part > .fir-headrow ~ .fir-headrow { margin-top:18px; }
    #fir-page .fir-headrow-btn { justify-self:start; display:flex; }
    #fir-page .fir-headrow-btn .btn { white-space:nowrap; }
    #fir-page .fir-headrow-title { text-align:center; white-space:nowrap; font-family:'Jameel Noori Nastaleeq',serif; }
  </style>
  <div id="fir-page">
    ${_renderFirPart('fir')}
    ${showCross ? _renderFirPart('cross_version') : ''}
  </div>`;

  const wrap = document.getElementById('fir-page');
  if (keepScroll !== null) { wrap.scrollTop = keepScroll; return; }
  if (focus === 'cross_version') {
    const sec = document.getElementById('fir-part-cross_version');
    if (sec) wrap.scrollTop += sec.getBoundingClientRect().top - wrap.getBoundingClientRect().top - 4;
  }
}

function _renderMatnTable(rows) {
  if (!rows.length) return `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:14px;">ابھی کوئی متن درج نہیں</div>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl;margin-bottom:6px;">
    <thead><tr style="background:var(--bg-secondary);">
      <th style="padding:8px;text-align:right;border:1px solid var(--border);">مضمون</th>
      <th style="padding:8px;text-align:center;border:1px solid var(--border);width:100px;">ایکشن</th>
    </tr></thead><tbody>
    ${rows.map(m => `<tr style="background:rgba(245,158,11,0.08);">
      <td style="padding:10px;border:1px solid var(--border);text-align:justify;font-family:'Jameel Noori Nastaleeq',serif;line-height:1.8;font-size:14pt;min-height:200px;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:12;-webkit-box-orient:vertical;">${esc(m.matn)||''}</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;white-space:nowrap;vertical-align:top;">
        <button title="ترمیم" aria-label="ترمیم" class="btn btn-secondary btn-sm" style="padding:2px 7px;" onclick="_openMatnModal('${m.type||'fir'}','${m.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
        <button title="دیکھیں" aria-label="دیکھیں" class="btn btn-secondary btn-sm" style="padding:2px 7px;margin-top:3px;" onclick="_viewMatn('${m.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button>
        <button title="پرنٹ" aria-label="پرنٹ" class="btn btn-secondary btn-sm" style="padding:2px 7px;margin-top:3px;" onclick="_printMatn('${m.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg></button>
        <button title="شیئر — PDF / Word" aria-label="شیئر" class="btn btn-secondary btn-sm" style="padding:2px 7px;margin-top:3px;" onclick="dioSharePrint(()=>_printMatn('${m.id}'),'متن ایف آئی آر')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg></button>
        <button title="حذف" aria-label="حذف" class="btn btn-danger btn-sm" style="padding:2px 7px;margin-top:3px;" onclick="_deleteMatn('${m.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
      </td></tr>`).join('')}
    </tbody></table>`;
}

function _renderCopyTable(rows) {
  if (!rows.length) return `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">ابھی کوئی فوٹو کاپی نہیں</div>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl;">
    <thead><tr style="background:var(--bg-secondary);">
      <th style="padding:8px;text-align:right;border:1px solid var(--border);">فوٹو کاپی</th>
      <th style="padding:8px;text-align:center;border:1px solid var(--border);width:120px;">ایکشن</th>
    </tr></thead><tbody>
    ${rows.map(c => {
      const isImage = (c.file_url||'').startsWith('data:image') || /-(jpg|jpeg|png|webp)$/i.test(c.file_name||'') || /\.(jpg|jpeg|png|webp)$/i.test(c.display_name||'');
      const shownName = c.file_display_name || c.display_name || c.file_name || 'فائل';
      return `<tr>
      <td style="padding:10px;border:1px solid var(--border);">
        ${isImage ?
          `<img src="${esc(c.file_url)}" style="max-width:60px;max-height:60px;border-radius:4px;cursor:pointer;" onclick="_dioViewFile('${_dioJsHtml(c.file_url)}','${_dioJsHtml(c.display_name||c.file_name||'فائل')}')">` :
          `<span style="cursor:pointer;color:var(--accent);" onclick="_dioViewFile('${_dioJsHtml(c.file_url)}','${_dioJsHtml(c.display_name||c.file_name||'فائل')}')">${esc(shownName)}</span>`}
      </td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;">
        <button title="دیکھیں" aria-label="دیکھیں" class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="_dioViewFile('${_dioJsHtml(c.file_url)}','${_dioJsHtml(c.display_name||c.file_name||'فائل')}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button>
        <button title="پرنٹ" aria-label="پرنٹ" class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="_dioViewFile('${_dioJsHtml(c.file_url)}','${_dioJsHtml(shownName)}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg></button>
        <button title="حذف" aria-label="حذف" class="btn btn-danger btn-sm" style="padding:2px 6px;" onclick="_deleteFirCopy('${c.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
      </td></tr>`;
    }).join('')}
    </tbody></table>`;
}

// ── MATN MODAL ────────────────────────────────────────────────
function _openMatnModal(type, id) {
  const existing = id ? (_firMatn.find(m => m.id === id) || {}) : {};
  openModal(id ? 'متن میں ترمیم' : 'متن درج کریں', `
    <div style="direction:rtl;width:80vw;max-width:90vw;">
      <textarea id="fir-matn-text" data-mic="true" placeholder="یہاں مکمل متن لکھیں یا پیسٹ کریں..." style="width:100%;min-height:50vh;box-sizing:border-box;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;line-height:1.8;direction:rtl;text-align:right;outline:none;">${esc(existing.matn)||''}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveMatn('${type}','${id||''}')">محفوظ کریں</button>
  `);
  // v552: «متن میں ترمیم» / «متن درج کریں» کی سرخی درمیان میں (افسر کی ہدایت)
  try { const mt = document.getElementById('modal-title'); if (mt) mt.classList.add('dio-mt-center'); } catch (_) { /* ikhtiyari */ }
  // Enlarge the shared modal box
  setTimeout(() => {
    const box = document.querySelector('#modal-backdrop > div, .modal-box, #modal-box');
    if (box) { box.style.maxWidth = '90vw'; box.style.width = 'auto'; box.style.minHeight = '70vh'; }
    if (typeof applyMicButtons === 'function') applyMicButtons(document.getElementById('modal-body'));
  }, 20);
}

async function _saveMatn(type, id) {
  const matn = document.getElementById('fir-matn-text')?.value.trim();
  if (!matn) { showToast('متن لکھیں', 'error'); return; }
  const rec = { case_id: _firCaseId, matn, type: type || 'fir' };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    if (id) {
      // v547: نتیجہ دیکھ کر — پہلے سرور رد کرتا تب بھی «محفوظ ہو گیا»
      const { data, error } = await supabaseClient.from('fir_matn').update(rec).eq('id', id).select().single();
      if (error) throw error;
      const idx = _firMatn.findIndex(m => m.id === id);
      if (idx >= 0) _firMatn[idx] = data || { ..._firMatn[idx], ...rec };
    } else {
      const { data, error } = await supabaseClient.from('fir_matn').insert(rec).select().single();
      if (error) throw error;
      _firMatn.push(data ? { ...data, type: data.type || rec.type } : { ...rec, id:'tmp_'+Date.now() });
    }
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR matn: local save nakaam', _); }
    closeModal();
    _renderFir(type || 'fir');
    showToast('متن محفوظ ہو گیا', 'success');
  } catch(e) { dioWriteFail('متن', e, 'محفوظ نہیں ہوا'); }
}

async function _deleteMatn(id) {
  if (!confirm('کیا آپ یہ متن حذف کرنا چاہتے ہیں؟')) return;
  const row = _firMatn.find(m => m.id === id);
  const type = row?.type || 'fir';
  try {
    // v547: سرور کا نتیجہ دیکھ کر (عارضی id صرف اس آلے پر تھی)
    if (String(id).indexOf('tmp_') !== 0) dioWriteOk(await supabaseClient.from('fir_matn').delete().eq('id', id).select('id'), 'fir matn delete', true);
    _firMatn = _firMatn.filter(m => m.id !== id);
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR matn: local save nakaam', _); }
    _renderFir(type);
    showToast('حذف ہو گیا', 'info');
  } catch(e) { dioWriteFail('متن', e, 'حذف نہیں ہوا'); }
}

// ── PHOTOCOPY UPLOAD (base64 — offline-safe) ──────────────────
function _uploadFirCopy(input, type) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async (e) => {
    let dataUrl = e.target.result;
    // Compress images
    if (f.type.startsWith('image/')) {
      dataUrl = await _firCompress(dataUrl, 1200, 0.7);
    }
    const ext = (f.name||'file').split('.').pop();
    const base = (f.name||'file').replace(/\.[^.]+$/,''); // strip extension
    const safeName = base.replace(/\//g,'-').replace(/\./g,'-').replace(/\s+/g,'_') + '.' + ext;
    const rec = { case_id: _firCaseId, file_url: dataUrl, file_name: safeName, display_name: f.name, file_display_name: f.name, type: type || 'fir' };
    try {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      if (oid) rec.officer_id = oid;
      const { data, error } = await supabaseClient.from('fir_copies').insert(rec).select().single();
      if (error) throw error;
      _firCopies.push(data ? { ...data, type: data.type || rec.type } : { ...rec, id:'tmp_'+Date.now() });
      try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR copies: local save nakaam', _); }
      _renderFir(type || 'fir');
      showToast('فوٹو کاپی اپلوڈ ہو گئی', 'success');
    } catch(err) { showToast('' + err.message, 'error'); }
  };
  r.readAsDataURL(f);
}

function _firCompress(dataUrl, maxW, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function _deleteFirCopy(id) {
  if (!confirm('کیا آپ یہ فوٹو کاپی حذف کرنا چاہتے ہیں؟')) return;
  const row = _firCopies.find(c => c.id === id);
  const type = row?.type || 'fir';
  try {
    if (String(id).indexOf('tmp_') !== 0) dioWriteOk(await supabaseClient.from('fir_copies').delete().eq('id', id).select('id'), 'fir copy delete', true);
    _firCopies = _firCopies.filter(c => c.id !== id);
    try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('FIR copies: local save nakaam', _); }
    _renderFir(type);
    showToast('حذف ہو گیا', 'info');
  } catch(e) { dioWriteFail('فوٹو کاپی', e, 'حذف نہیں ہوئی'); }
}

// ── VIEW MATN (read-only modal) ───────────────────────────────
function _viewMatn(id) {
  const row = _firMatn.find(m => m.id === id);
  if (!row) { showToast('متن نہیں ملا', 'error'); return; }
  const heading = (row.type === 'cross_version') ? 'کراس ورژن' : 'ایف آئی آر';
  openModal('متن ' + heading, `
    <div style="direction:rtl;width:80vw;max-width:90vw;">
      <div style="width:100%;box-sizing:border-box;padding:20px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14pt;line-height:1.9;text-align:justify;direction:rtl;max-height:70vh;overflow-y:auto;white-space:pre-wrap;">${esc(row.matn)||''}</div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
    <button class="btn btn-primary" onclick="_printMatn('${id}')">پرنٹ</button>
    <button class="btn btn-secondary" onclick="dioSharePrint(()=>_printMatn('${id}'),'متن ایف آئی آر')" title="شیئر — PDF / Word">شیئر</button>
  `);
  setTimeout(() => {
    const box = document.querySelector('#modal-backdrop > div, .modal-box, #modal-box');
    if (box) { box.style.maxWidth = '90vw'; box.style.width = 'auto'; }
  }, 20);
}

// ── PRINT MATN (صرف کاغذ — ایپ کا کوئی حصہ نہیں) ──────────────────
// ایک ہی کاغذ بنانے والا: سطر کا «پرنٹ»، اوپر کی پٹی کا «پرنٹ» اور Ctrl+P —
// تینوں یہی استعمال کرتے ہیں (نتیجہ بالکل ایک جیسا)۔ سرخی 20pt، متن 14pt۔
// پورا صفحہ: پہلے متن ایف آئی آر، پھر (ہو تو) نئے صفحے پر متن کراس ورژن۔
function _firPaperHtml(rows) {
  const groups = ['fir', 'cross_version'].map(t => ({
    t, heading: t === 'cross_version' ? 'متن کراس ورژن' : 'متن ایف آئی آر',
    items: rows.filter(r => (r.type || 'fir') === t && String(r.matn || '').trim()),
  })).filter(g => g.items.length);
  if (!groups.length) return '';
  const title = groups.map(g => g.heading).join(' — ');
  const body = groups.map(g => `
      <section class="fir-sec">
        <h1>${g.heading}</h1>
        ${g.items.map(r => `<div class="matn">${esc(r.matn)}</div>`).join('')}
      </section>`).join('');
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="utf-8">
    ${typeof dioFontHead==='function'?dioFontHead():''}
    <title>${title}</title>
    <style>
      @page { size: A4; margin: 20mm; }
      * { box-sizing: border-box; }
      html, body { margin:0; padding:0; background:#fff; }
      body { font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; direction:rtl; color:#000; }
      h1 { text-align:center; font-size:20pt; margin:0 0 14pt; font-weight:700; line-height:1.9; }
      .matn { font-size:14pt; line-height:1.9; text-align:justify; white-space:pre-wrap; }   /* v553: تمام تحریری دستاویزات — یکساں سطری فاصلہ 1.9 */
      .matn + .matn { margin-top:14pt; }
      .fir-sec + .fir-sec { break-before:page; page-break-before:always; }
    </style></head>
    <body>${body}
    </body></html>`;
}

function _firPrintRows(rows) {
  const html = _firPaperHtml(rows);
  if (!html) { showToast('ابھی کوئی متن درج نہیں', 'info'); return; }
  dioPrint(html);
}

// ایک متن (سطر کا «پرنٹ» بٹن)
function _printMatn(id) {
  const row = _firMatn.find(m => m.id === id);
  if (!row) { showToast('متن نہیں ملا', 'error'); return; }
  _firPrintRows([row]);
}

// پورا صفحہ (اوپر کی پٹی کا «پرنٹ» اور Ctrl+P) — صرف وہی حصے جو صفحے پر نظر آ رہے ہیں
function _firPrintPage() {
  const shown = new Set([...document.querySelectorAll('#fir-page section.fir-part')].map(s => s.dataset.type));
  _firPrintRows(_firMatn.filter(m => shown.has(m.type || 'fir')));
}
window._firPrintPage = _firPrintPage;
// Ctrl+P: index.html کا عمومی راستہ پورے صفحے والے منظر میں _dioPrintCurrent چلاتا ہے،
// اور وہ یہاں _firPrintPage پر آتا ہے — یعنی Ctrl+P اور اوپر کا «پرنٹ» ایک ہی راستہ۔
