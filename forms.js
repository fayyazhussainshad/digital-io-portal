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
    <button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);">واپس ←</button>
    <div>
      <div style="font-size:18px;font-weight:800;">📥 ٹیمپلیٹس</div>
      <div style="font-size:12px;color:var(--text-muted);">${templates.length} ٹیمپلیٹ · شامل کریں، ترمیم کریں، پرنٹ کریں</div>
    </div>
    <button class="btn btn-primary" onclick="_openAddTemplate()">+ نیا ٹیمپلیٹ</button>
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
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">${t.title}</div>
          <div style="font-size:10px;color:var(--text-muted);">${formatDate(t.created_at)}</div>
        </div>
        <div style="display:flex;gap:5px;direction:rtl;">
          <button class="btn btn-primary btn-sm" onclick="_printTemplate('${t.id}')">🖨️ پرنٹ</button>
          <button class="btn btn-secondary btn-sm" onclick="_copyTemplate('${t.id}')">📋 کاپی</button>
          <button class="btn btn-secondary btn-sm" onclick="_editTemplate('${t.id}')">✏️ ترمیم</button>
          <button class="btn btn-secondary btn-sm" onclick="_renameTemplate('${t.id}','${t.title.replace(/'/g,'')}')">✏️ نام</button>
          <button class="btn btn-danger btn-sm" onclick="_deleteTemplate('${t.id}')">🗑️</button>
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
      <input class="form-input" id="tpl-title" value="${e.title||''}" placeholder="مثلاً گواہی کا فارم" style="margin-bottom:10px;">
      <label class="form-label">مواد *</label>
      <textarea class="form-input" id="tpl-content" rows="12"
        style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14px;direction:rtl;line-height:2;resize:vertical;"
        placeholder="یہاں ٹیمپلیٹ لکھیں...">${e.content||''}</textarea>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_saveTemplate('${e.id||''}')">💾 محفوظ</button>
    </div>`
  );
}

async function _saveTemplate(existingId) {
  const title   = document.getElementById('tpl-title')?.value.trim();
  const content = document.getElementById('tpl-content')?.value.trim();
  if (!title)   { showToast('⚠️ نام ضروری ہے','error'); return; }
  if (!content) { showToast('⚠️ مواد ضروری ہے','error'); return; }

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
  navigator.clipboard.writeText(data.content||'').then(() => showToast('📋 کاپی ہو گئی','success'));
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
