/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — FIR / CROSS VERSION (متن + فوٹو کاپی)
   ═══════════════════════════════════════════════════════════ */

let _firCaseId = null;
let _firMatn = [];     // all fir_matn rows for this case
let _firCopies = [];   // all fir_copies rows for this case
let _firCopyUpload = null;

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
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) {}
    try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) {}
  } catch(_) {
    try { _firMatn = JSON.parse(localStorage.getItem('dio_firmatn_'+_firCaseId)||'[]'); } catch(_2) { _firMatn=[]; }
    try { _firCopies = JSON.parse(localStorage.getItem('dio_fircopies_'+_firCaseId)||'[]'); } catch(_2) { _firCopies=[]; }
  }
}

// Render ONE section (fir or cross_version)
function _renderFir(type) {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const isCross = type === 'cross_version';
  const heading = isCross ? 'کراس ورژن' : 'الف آئی آر';
  const color = isCross ? 'var(--amber)' : 'var(--accent)';

  const matn = _firMatn.filter(m => (m.type||'fir') === type);
  const copies = _firCopies.filter(c => (c.type||'fir') === type);

  area.innerHTML = `
  <div style="direction:rtl;height:100%;overflow-y:auto;padding:10px;width:100%;box-sizing:border-box;">

    <!-- متن -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${color};padding-bottom:6px;margin-bottom:10px;">
      <div style="font-size:19px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};">متن ${heading}</div>
      <button class="btn btn-primary btn-sm" onclick="_openMatnModal('${type}')">متن درج کریں</button>
    </div>
    ${_renderMatnTable(matn)}

    <!-- فوٹو کاپی -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:6px;margin:18px 0 10px;">
      <div style="font-size:17px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">فوٹو کاپی ${heading}</div>
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('fir-copy-input').click()">فوٹو کاپی اپلوڈ کریں</button>
      <input type="file" id="fir-copy-input" accept="image/*,application/pdf" style="display:none;" onchange="_uploadFirCopy(this,'${type}')">
    </div>
    ${_renderCopyTable(copies)}

  </div>`;
}

function _renderMatnTable(rows) {
  if (!rows.length) return `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:14px;">ابھی کوئی متن درج نہیں</div>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl;margin-bottom:6px;">
    <thead><tr style="background:var(--bg-secondary);">
      <th style="padding:8px;text-align:right;border:1px solid var(--border);">مضمون</th>
      <th style="padding:8px;text-align:center;border:1px solid var(--border);width:90px;">ایکشن</th>
    </tr></thead><tbody>
    ${rows.map(m => `<tr style="background:rgba(245,158,11,0.08);">
      <td style="padding:10px;border:1px solid var(--border);text-align:justify;font-family:'Jameel Noori Nastaleeq',serif;line-height:1.8;font-size:14px;min-height:80px;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${m.matn||''}</td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;">
        <button class="btn btn-secondary btn-sm" style="padding:2px 7px;" onclick="_openMatnModal('${m.type||'fir'}','${m.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" style="padding:2px 7px;margin-top:3px;" onclick="_deleteMatn('${m.id}')">🗑️</button>
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
          `<img src="${c.file_url}" style="max-width:60px;max-height:60px;border-radius:4px;cursor:pointer;" onclick="window.open('${c.file_url}','_blank')">` :
          `<span style="cursor:pointer;color:var(--accent);" onclick="window.open('${c.file_url}','_blank')">📄 ${shownName}</span>`}
      </td>
      <td style="padding:6px;border:1px solid var(--border);text-align:center;">
        <button class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="window.open('${c.file_url}','_blank')">👁️</button>
        <button class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="_printFirCopy('${c.file_url}','${shownName.replace(/'/g,'')}')">🖨️</button>
        <button class="btn btn-danger btn-sm" style="padding:2px 6px;" onclick="_deleteFirCopy('${c.id}')">🗑️</button>
      </td></tr>`;
    }).join('')}
    </tbody></table>`;
}

// ── MATN MODAL ────────────────────────────────────────────────
function _openMatnModal(type, id) {
  const existing = id ? (_firMatn.find(m => m.id === id) || {}) : {};
  openModal(id ? '✏️ متن میں ترمیم' : '➕ متن درج کریں', `
    <div style="direction:rtl;width:80vw;max-width:90vw;">
      <textarea id="fir-matn-text" placeholder="یہاں مکمل متن لکھیں یا پیسٹ کریں..." style="width:100%;min-height:50vh;box-sizing:border-box;padding:16px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;line-height:1.8;direction:rtl;text-align:right;outline:none;">${existing.matn||''}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveMatn('${type}','${id||''}')">💾 محفوظ کریں</button>
  `);
  // Enlarge the shared modal box
  setTimeout(() => {
    const box = document.querySelector('#modal-backdrop > div, .modal-box, #modal-box');
    if (box) { box.style.maxWidth = '90vw'; box.style.width = 'auto'; box.style.minHeight = '70vh'; }
  }, 20);
}

async function _saveMatn(type, id) {
  const matn = document.getElementById('fir-matn-text')?.value.trim();
  if (!matn) { showToast('⚠️ متن لکھیں', 'error'); return; }
  const rec = { case_id: _firCaseId, matn, type: type || 'fir' };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    if (id) {
      const { data } = await supabaseClient.from('fir_matn').update(rec).eq('id', id).select().single();
      const idx = _firMatn.findIndex(m => m.id === id);
      if (idx >= 0) _firMatn[idx] = data || { ..._firMatn[idx], ...rec };
    } else {
      const { data, error } = await supabaseClient.from('fir_matn').insert(rec).select().single();
      if (error) throw error;
      _firMatn.push(data ? { ...data, type: data.type || rec.type } : { ...rec, id:'tmp_'+Date.now() });
    }
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) {}
    closeModal();
    _renderFir(type || 'fir');
    showToast('✅ متن محفوظ ہو گیا', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteMatn(id) {
  if (!confirm('کیا آپ یہ متن حذف کرنا چاہتے ہیں؟')) return;
  const row = _firMatn.find(m => m.id === id);
  const type = row?.type || 'fir';
  try {
    await supabaseClient.from('fir_matn').delete().eq('id', id);
    _firMatn = _firMatn.filter(m => m.id !== id);
    try { localStorage.setItem('dio_firmatn_'+_firCaseId, JSON.stringify(_firMatn)); } catch(_) {}
    _renderFir(type);
    showToast('🗑️ حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
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
      try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) {}
      _renderFir(type || 'fir');
      showToast('✅ فوٹو کاپی اپلوڈ ہو گئی', 'success');
    } catch(err) { showToast('❌ ' + err.message, 'error'); }
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
    await supabaseClient.from('fir_copies').delete().eq('id', id);
    _firCopies = _firCopies.filter(c => c.id !== id);
    try { localStorage.setItem('dio_fircopies_'+_firCaseId, JSON.stringify(_firCopies)); } catch(_) {}
    _renderFir(type);
    showToast('🗑️ حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT ONE COPY (no app UI) ────────────────────────────────
function _printFirCopy(url, name) {
  const isImg = url.startsWith('data:image') || /-(jpg|jpeg|png|webp)$/i.test(name||'') || /\.(jpg|jpeg|png|webp)$/i.test(name||'');
  if (isImg) {
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${name||'فوٹو کاپی'}</title>
      <style>@page{size:A4;margin:8mm}html,body{margin:0;padding:0;height:auto;}img{max-width:100%;max-height:98vh;display:block;margin:0 auto;}</style></head>
      <body><img src="${url}"></body></html>`;
    if (typeof dioPrint === 'function') dioPrint(html);
    else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>{w.print();},400); }
  } else {
    // PDF — open in new tab for printing (avoids blank pages)
    window.open(url, '_blank');
  }
}
