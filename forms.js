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
    const { data } = await supabaseClient.from('law_library')
      .select('*').eq('officer_id', oid)
      .eq('category', 'template')
      .order('created_at', { ascending: false });
    templates = data || [];
  } catch(_) {}

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
        <div style="font-size:22px;flex-shrink:0;">${t.file_url ? (t.file_name||'').toLowerCase().endsWith('.pdf') ? '📕' : '📘' : '📋'}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">${t.title}</div>
          <div style="font-size:10px;color:var(--text-muted);">${formatDate(t.created_at)}${t.file_name ? ` · ${t.file_name}` : ''}</div>
        </div>
        <div style="display:flex;gap:5px;direction:rtl;flex-wrap:wrap;">
          ${t.file_url
            ? `<button class="btn btn-primary btn-sm" onclick="window.open('${t.file_url}','_blank')">⬇️ ڈاؤنلوڈ</button>`
            : `<button class="btn btn-primary btn-sm" onclick="_fillTemplateFromCase('${t.id}')">🔗 مقدمہ سے بھریں</button>`}
          ${!t.file_url ? `<button class="btn btn-secondary btn-sm" onclick="_printTemplate('${t.id}')">🖨️ پرنٹ</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="_copyTemplate('${t.id}')">📋 کاپی</button>
          <button class="btn btn-secondary btn-sm" onclick="_editTemplate('${t.id}')">✏️ ترمیم</button>
          <button class="btn btn-secondary btn-sm" onclick="_renameTemplate('${t.id}','${t.title.replace(/'/g,'')}')">✏️ نام</button>
          <button class="btn btn-danger btn-sm" onclick="_deleteTemplate('${t.id}')">🗑️</button>
        </div>
      </div>
      <!-- Template Preview -->
      ${t.file_url
        ? `<div style="padding:12px 14px;direction:rtl;font-size:12px;color:var(--text-muted);">📎 منسلک فائل — ڈاؤنلوڈ کر کے استعمال کریں یا اپنی جگہ لے جائیں</div>`
        : `<div style="padding:12px 14px;max-height:100px;overflow:hidden;position:relative;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:13px;color:var(--text-secondary);">
        ${(t.content||'').slice(0,200)}${(t.content||'').length>200?'...':''}
        <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(transparent,var(--bg-card));"></div>
      </div>`}
    </div>`).join('')}
  </div>`}`;
}

// ── ADD TEMPLATE ──────────────────────────────────────────────
function _openAddTemplate(existing) {
  const e = existing || {};
  openModal(existing ? '✏️ ٹیمپلیٹ ترمیم' : '+ نیا ٹیمپلیٹ',
    `<div style="direction:rtl;">
      <label class="form-label">ٹیمپلیٹ کا نام *</label>
      <input class="form-input" id="tpl-title" value="${e.title||''}" placeholder="مثلاً گواہی کا فارم" style="margin-bottom:14px;">

      <!-- File upload option -->
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:14px;">
        <label class="form-label" style="margin-bottom:6px;display:block;">📎 Word / PDF فائل اپ لوڈ کریں (اختیاری)</label>
        <input type="file" id="tpl-file" accept=".doc,.docx,.pdf,.txt,.rtf"
          style="width:100%;font-size:12px;color:var(--text-secondary);" onchange="_onTplFileSelect(this)">
        ${e.file_url ? `<div style="margin-top:8px;font-size:12px;color:var(--green);">✅ موجودہ فائل: <a href="${e.file_url}" target="_blank" style="color:var(--accent);">${e.file_name||'فائل'}</a></div>` : ''}
        <div id="tpl-file-status" style="font-size:11px;color:var(--text-muted);margin-top:6px;"></div>
      </div>

      <div style="text-align:center;color:var(--text-muted);font-size:11px;margin-bottom:10px;">— یا —</div>

      <label class="form-label">مواد (ٹیکسٹ ٹیمپلیٹ)</label>
      <textarea class="form-input" id="tpl-content" rows="10"
        style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14px;direction:rtl;line-height:2;resize:vertical;"
        placeholder="یہاں ٹیمپلیٹ لکھیں... (یا اوپر فائل اپ لوڈ کریں)">${e.content||''}</textarea>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_saveTemplate('${e.id||''}')">💾 محفوظ</button>
    </div>`
  );
}

// Track selected file
let _tplSelectedFile = null;
function _onTplFileSelect(input) {
  _tplSelectedFile = input.files[0] || null;
  const status = document.getElementById('tpl-file-status');
  if (status && _tplSelectedFile) {
    const sizeKB = Math.round(_tplSelectedFile.size / 1024);
    status.innerHTML = `<span style="color:var(--accent);">📄 ${_tplSelectedFile.name} (${sizeKB} KB)</span>`;
  }
}

async function _saveTemplate(existingId) {
  const title   = document.getElementById('tpl-title')?.value.trim();
  const content = document.getElementById('tpl-content')?.value.trim();
  if (!title)   { showToast('⚠️ نام ضروری ہے','error'); return; }

  try {
    const oid = await getOfficerId();
    let file_url = null, file_name = null;

    // Upload file if selected
    if (_tplSelectedFile) {
      showToast('📤 فائل اپ لوڈ ہو رہی ہے...', 'info');
      const ext = _tplSelectedFile.name.split('.').pop();
      const path = `templates/${oid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabaseClient.storage
        .from('law-files').upload(path, _tplSelectedFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from('law-files').getPublicUrl(path);
      file_url = urlData.publicUrl;
      file_name = _tplSelectedFile.name;
    }

    if (!content && !file_url && !existingId) {
      showToast('⚠️ مواد لکھیں یا فائل اپ لوڈ کریں', 'error'); return;
    }

    const rec = { title, content: content || null };
    if (file_url) { rec.file_url = file_url; rec.file_name = file_name; }

    if (existingId) {
      await supabaseClient.from('law_library').update(rec).eq('id', existingId);
    } else {
      await supabaseClient.from('law_library').insert({ ...rec, officer_id: oid, category: 'template' });
    }
    _tplSelectedFile = null;
    closeModal();
    showToast('✅ ٹیمپلیٹ محفوظ', 'success');
    _buildForms();
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
    <div class="hdr"><h2>محکمہ پولیس پنجاب</h2>
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
