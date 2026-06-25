/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — TEMPLATES  (forms.js)
   Manual templates only — Add/Edit/Print/Copy/Delete/Rename
   ═══════════════════════════════════════════════════════════ */

registerPage('forms', renderOfficialForms);

async function renderOfficialForms(container) {
  container.innerHTML = `<div style="max-width:none;" id="forms-root">
    <div style="text-align:center;padding:20px;color:var(--text-muted);">⏳</div>
  </div>`;
  await _buildForms();
}

async function _buildForms() {
  const root = document.getElementById('forms-root');
  if (!root) return;

  let templates = [];
  try {
    const oid = await getOfficerId();
    // Officer's own templates + default (admin) templates
    const { data } = await supabaseClient.from('law_library')
      .select('*')
      .eq('category', 'template')
      .or(`officer_id.eq.${oid},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    templates = data || [];
  } catch(_) {
    // Fallback: just officer's own
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('law_library')
        .select('*').eq('officer_id', oid).eq('category', 'template')
        .order('created_at', { ascending: false });
      templates = data || [];
    } catch(_) {}
  }

  root.innerHTML = `
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;">
    <button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:20px;font-weight:700;cursor:pointer;color:var(--accent);line-height:1;">←</button>
    <div>
      <div style="font-size:18px;font-weight:800;">📥 ٹیمپلیٹس</div>
      <div style="font-size:12px;color:var(--text-muted);">${templates.length} ٹیمپلیٹ · شامل کریں، ترمیم کریں، پرنٹ کریں</div>
    </div>
    <button class="btn btn-primary" onclick="_openAddTemplate()">+ نیا ٹیمپلیٹ</button>
  </div>

  <!-- Ripple Effect help -->
  <div style="background:rgba(56,189,248,0.06);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:14px;direction:rtl;font-size:12px;color:var(--text-secondary);">
    🔗 <b>خودکار بھرائی (Ripple Effect):</b> ٹیمپلیٹ میں یہ نشانیاں لکھیں — پرنٹ کرتے وقت مقدمے کا ڈیٹا خودبخود بھر جائے گا:<br>
    <span style="font-family:monospace;color:var(--accent);font-size:11px;">{مدعی} · {شناختی_کارڈ} · {موبائل} · {پیشہ} · {FIR} · {دفعات} · {تاریخ} · {تھانہ} · {ضلع} · {افسر}</span>
  </div>

  ${templates.length === 0 ? `
  <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
    <div style="font-size:52px;margin-bottom:14px;">📥</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;font-family:'Jameel Noori Nastaleeq',serif;">کوئی ٹیمپلیٹ نہیں</div>
    <div style="font-size:12px;margin-bottom:16px;">+ نیا ٹیمپلیٹ بٹن دبا کر شامل کریں</div>
    <button class="btn btn-primary" onclick="_openAddTemplate()">+ پہلا ٹیمپلیٹ شامل کریں</button>
  </div>` : `
  <div style="display:flex;flex-direction:column;gap:8px;">
    ${templates.map(t => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
      <!-- Template Header -->
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border);direction:rtl;">
        <div style="font-size:22px;flex-shrink:0;">${t.is_default ? '⭐' : '📋'}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">${t.title}${t.is_default ? ' <span style="font-size:9px;background:var(--accent-glow);color:var(--accent);border-radius:6px;padding:1px 6px;">سرکاری</span>' : ''}</div>
          <div style="font-size:10px;color:var(--text-muted);">${formatDate(t.created_at)}</div>
        </div>
        <div style="display:flex;gap:5px;direction:rtl;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="_editTemplate('${t.id}')">✏️ ترمیم / استعمال</button>
          <button class="btn btn-secondary btn-sm" onclick="_fillTemplateFromCase('${t.id}')">🔗 مقدمہ سے بھریں</button>
          <button class="btn btn-secondary btn-sm" onclick="_copyTemplate('${t.id}')">📋 کاپی</button>
          <button class="btn btn-secondary btn-sm" onclick="_downloadTplWord('${t.id}')">📘 Word</button>
          <button class="btn btn-secondary btn-sm" onclick="_printTemplate('${t.id}')">📕 PDF / پرنٹ</button>
          ${!t.is_default ? `<button class="btn btn-danger btn-sm" onclick="_deleteTemplate('${t.id}')">🗑️</button>` : ''}
        </div>
      </div>
      <!-- Template Preview -->
      <div style="padding:12px 14px;max-height:100px;overflow:hidden;position:relative;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:13px;color:var(--text-secondary);">
        ${(t.content||'').slice(0,200)}${(t.content||'').length>200?'...':''}
        <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(transparent,var(--bg-card));"></div>
      </div>
    </div>`).join('')}
  </div>`}`;
}

// ── ADD TEMPLATE ──────────────────────────────────────────────
function _openAddTemplate(existing) {
  const e = existing || {};
  openModal(existing ? '✏️ ٹیمپلیٹ ترمیم' : '+ نیا ٹیمپلیٹ',
    `<div style="direction:rtl;">
      <label class="form-label">ٹیمپلیٹ کا نام *</label>
      <input class="form-input" id="tpl-title" value="${(e.title||'').replace(/"/g,'&quot;')}" placeholder="مثلاً گواہی کا فارم" style="margin-bottom:14px;">

      <!-- Import text from Word/PDF/txt file -->
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:14px;">
        <label class="form-label" style="margin-bottom:6px;display:block;">📎 Word/PDF/Text فائل سے متن نکالیں (اختیاری)</label>
        <input type="file" id="tpl-file" accept=".txt,.doc,.docx,.pdf,.rtf"
          style="width:100%;font-size:12px;color:var(--text-secondary);" onchange="_extractTplFile(this)">
        <div id="tpl-file-status" style="font-size:11px;color:var(--text-muted);margin-top:6px;">فائل منتخب کریں — اس کا متن نیچے خانے میں آ جائے گا جہاں آپ ترمیم کر سکتے ہیں</div>
      </div>

      <label class="form-label">مواد (یہاں ترمیم کریں) *</label>
      <textarea class="form-input" id="tpl-content" rows="12"
        style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14px;direction:rtl;line-height:2;resize:vertical;"
        placeholder="یہاں ٹیمپلیٹ کا متن لکھیں یا اوپر فائل سے نکالیں...">${e.content||''}</textarea>
      <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">💡 {مدعی}، {FIR}، {دفعات} جیسی نشانیاں لکھیں تو مقدمے کا ڈیٹا خودبخود بھر جائے گا</div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      ${existing ? `<button class="btn btn-secondary" onclick="_saveTemplateAsNew()">📄 نئے نام سے محفوظ (کاپی)</button>` : ''}
      <button class="btn btn-primary" onclick="_saveTemplate('${e.id||''}')">💾 محفوظ</button>
    </div>`
  );
}

// Save the edited content as a brand-new template (a copy with a new name)
async function _saveTemplateAsNew() {
  const content = document.getElementById('tpl-content')?.value.trim();
  const oldTitle = document.getElementById('tpl-title')?.value.trim() || 'ٹیمپلیٹ';
  if (!content) { showToast('⚠️ مواد خالی ہے', 'error'); return; }
  // Ask for a new name
  const newName = prompt('نئے ٹیمپلیٹ کا نام درج کریں:', oldTitle + ' (کاپی)');
  if (!newName || !newName.trim()) return;
  try {
    const oid = await getOfficerId();
    await supabaseClient.from('law_library').insert({
      officer_id: oid, title: newName.trim(), content, category: 'template'
    });
    closeModal();
    showToast('✅ نئے نام سے محفوظ ہو گیا', 'success');
    _buildForms();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// Extract text from uploaded file (txt directly; doc/pdf via best-effort)
async function _extractTplFile(input) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById('tpl-file-status');
  const textarea = document.getElementById('tpl-content');
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  if (status) status.innerHTML = '⏳ متن نکالا جا رہا ہے...';

  try {
    if (ext === 'txt' || ext === 'rtf') {
      const text = await file.text();
      if (textarea) textarea.value = (textarea.value ? textarea.value + '\n' : '') + text;
      if (status) status.innerHTML = `<span style="color:var(--green);">✅ متن نکال لیا گیا — اب ترمیم کریں</span>`;
    } else if (ext === 'docx') {
      // DOCX is a zip; try basic text extraction
      const text = await _extractDocxText(file);
      if (textarea) textarea.value = (textarea.value ? textarea.value + '\n' : '') + text;
      if (status) status.innerHTML = `<span style="color:var(--green);">✅ Word کا متن نکال لیا گیا — اب ترمیم کریں</span>`;
    } else {
      // doc / pdf — can't reliably extract in browser
      if (status) status.innerHTML = `<span style="color:var(--amber);">⚠️ ${ext.toUpperCase()} فائلوں سے خودکار متن مشکل ہے — براہِ کرم متن کاپی کر کے خانے میں پیسٹ کریں</span>`;
    }
  } catch(err) {
    if (status) status.innerHTML = `<span style="color:var(--red);">❌ متن نہیں نکل سکا — متن کاپی کر کے پیسٹ کریں</span>`;
  }
}

// Basic DOCX text extraction (reads document.xml from the zip)
async function _extractDocxText(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Find document.xml content — simple approach: decode and strip tags
  // DOCX is a zip, so we need the raw text between <w:t> tags
  const decoder = new TextDecoder('utf-8');
  const raw = decoder.decode(bytes);
  const matches = raw.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (matches) {
    return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
  }
  throw new Error('no text');
}

async function _saveTemplate(existingId) {
  const title   = document.getElementById('tpl-title')?.value.trim();
  const content = document.getElementById('tpl-content')?.value.trim();
  if (!title)   { showToast('⚠️ نام ضروری ہے','error'); return; }
  if (!content) { showToast('⚠️ مواد لکھیں یا فائل سے نکالیں','error'); return; }

  try {
    const oid = await getOfficerId();
    if (existingId) {
      await supabaseClient.from('law_library').update({ title, content }).eq('id', existingId);
    } else {
      await supabaseClient.from('law_library').insert({ officer_id: oid, title, content, category: 'template' });
    }
    closeModal();
    showToast('✅ ٹیمپلیٹ محفوظ', 'success');
    _buildForms();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// Download template as a real Word (.doc) file to the officer's PC
async function _downloadTplWord(id) {
  try {
    const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
    if (!data) return;
    const content = (data.content || '').replace(/\n/g, '<br>');
    // Word-compatible HTML document with RTL + Urdu font
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${data.title}</title>
<style>body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Times New Roman',serif;direction:rtl;text-align:right;font-size:14pt;line-height:2;}</style>
</head><body><h2 style="text-align:center;">${data.title}</h2>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.title}.html`;
    a.click();
    showToast('📘 فائل ڈاؤنلوڈ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _editTemplate(id) {
  const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
  if (data) _openAddTemplate(data);
}

async function _renameTemplate(id, oldName) {
  openModal('✏️ نام تبدیل کریں',
    `<div style="direction:rtl;">
      <label class="form-label">نیا نام</label>
      <input class="form-input" id="tpl-rename" value="${oldName}" placeholder="ٹیمپلیٹ کا نام">
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doRenameTemplate('${id}')">💾 تبدیل</button>
    </div>`
  );
}

async function _doRenameTemplate(id) {
  const title = document.getElementById('tpl-rename')?.value.trim();
  if (!title) return;
  await supabaseClient.from('law_library').update({ title }).eq('id', id);
  closeModal();
  showToast('✅ نام تبدیل ہو گیا', 'success');
  _buildForms();
}

// ── RIPPLE EFFECT: Fill template from case data (B3) ──────────
async function _fillTemplateFromCase(id) {
  // Load all cases to pick from
  const cases = await getCases().catch(()=>[]);
  if (!cases.length) { showToast('⚠️ کوئی مقدمہ موجود نہیں', 'warn'); return; }

  const options = cases.map(c =>
    `<option value="${c.id}">FIR ${c.fir_number||'—'} · ${(c.complainant||'').slice(0,20)}</option>`
  ).join('');

  openModal('🔗 مقدمہ منتخب کریں', `
    <div style="direction:rtl;">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">جس مقدمے کا ڈیٹا ٹیمپلیٹ میں بھرنا ہے وہ منتخب کریں</div>
      <select class="form-input" id="ripple-case">${options}</select>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_doRippleFill('${id}')">📄 بھریں اور پرنٹ کریں</button>
  `);
}

async function _doRippleFill(templateId) {
  const caseId = document.getElementById('ripple-case')?.value;
  if (!caseId) return;

  try {
    // Get template content
    const { data: tpl } = await supabaseClient.from('law_library').select('*').eq('id', templateId).single();
    if (!tpl) { showToast('❌ ٹیمپلیٹ نہیں ملا', 'error'); return; }

    // Get case data
    const cases = await getCases().catch(()=>[]);
    const c = cases.find(x => x.id === caseId);
    if (!c) { showToast('❌ مقدمہ نہیں ملا', 'error'); return; }

    const o = currentOfficer || {};

    // Replacement map — the Ripple Effect
    const map = {
      '{مدعی}':         c.complainant || '____',
      '{شناختی_کارڈ}':  c.complainant_cnic || '____',
      '{موبائل}':       c.complainant_cell || '____',
      '{پیشہ}':         c.complainant_profession || '____',
      '{FIR}':          c.fir_number || '____',
      '{دفعات}':        c.section_of_law || '____',
      '{تاریخ}':        formatDate(c.fir_date) || '____',
      '{تاریخ_وقوعہ}':  formatDate(c.occurrence_date) || '____',
      '{تھانہ}':        c.case_station || o.station || '____',
      '{ضلع}':          c.case_district || o.district || '____',
      '{افسر}':         o.full_name || '____',
      '{عہدہ}':         o.designation || '____',
      '{ملزم}':         c.accused_name || '____',
    };

    let content = tpl.content || '';
    Object.entries(map).forEach(([k, v]) => {
      content = content.split(k).join(v);
    });

    closeModal();

    // Print the filled template
    const html = `
    <div style="font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;padding:40px;line-height:2.2;font-size:16px;color:#000;white-space:pre-wrap;">
      <div style="text-align:center;font-weight:800;font-size:20px;margin-bottom:20px;text-decoration:underline;">${tpl.title||''}</div>
      ${content}
    </div>`;

    if (typeof dioPrint === 'function') dioPrint(html);
    showToast('✅ مقدمے کا ڈیٹا بھر دیا گیا', 'success');
  } catch(e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function _printTemplate(id) {
  const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
  if (!data) return;
  const o = currentOfficer || {};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>@page{margin:20mm;}body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;color:#111;font-size:14px;line-height:2;}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:16px;}
    .footer{font-size:10px;color:#666;text-align:center;margin-top:30px;border-top:1px solid #ccc;padding-top:8px;}
    .sig{display:flex;justify-content:space-between;margin-top:40px;}
    .sig-box{text-align:center;}.sig-line{border-top:1px solid #000;padding-top:5px;margin-top:30px;}</style>
    </head><body>
    <div class="hdr"><h2></h2>
    <div>تھانہ ${o.station||'—'} · ضلع ${o.district||'—'}</div>
    <h3>${data.title}</h3></div>
    <div>${(data.content||'').replace(/\n/g,'<br>')}</div>
    <div class="sig">
      <div class="sig-box"><div class="sig-line">دستخط SHO<br>تھانہ ${o.station||'—'}</div><div style="font-size:10px;margin-top:4px;">${new Date().toLocaleDateString('en-PK')}</div></div>
    </div>
    <div class="footer">Digital IO · ${new Date().toLocaleDateString('en-PK')}</div>
    
    </body></html>`);
  dioPrint(_printHTML);
}

async function _copyTemplate(id) {
  const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
  if (!data) return;
  // If it's a file template, copy the download link; otherwise copy the text content
  const toCopy = data.file_url ? data.file_url : (data.content || '');
  if (!toCopy) { showToast('⚠️ کاپی کرنے کے لیے کچھ نہیں', 'warn'); return; }
  navigator.clipboard.writeText(toCopy).then(
    () => showToast(data.file_url ? '📋 فائل لنک کاپی ہو گیا' : '📋 ٹیکسٹ کاپی ہو گیا', 'success'),
    () => showToast('❌ کاپی نہیں ہو سکا', 'error')
  );
}

async function _deleteTemplate(id) {
  openModal('🗑️ حذف',
    `<p style="color:var(--red);direction:rtl;">کیا آپ یہ ٹیمپلیٹ حذف کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-danger" onclick="closeModal();_doDelTemplate('${id}')">🗑️ حذف</button>
    </div>`
  );
}

async function _doDelTemplate(id) {
  await supabaseClient.from('law_library').delete().eq('id',id);
  showToast('🗑️ حذف ہو گیا','info');
  _buildForms();
}
