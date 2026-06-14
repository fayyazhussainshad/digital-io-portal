/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — LAW LIBRARY  v3  (law.js)
   Full law documents (complete PPC/CrPC etc.) — NO sections
   Buttons in one line: view · rename · print · download · online · upload
   ═══════════════════════════════════════════════════════════ */

registerPage('law', renderLaw);

const _LAW_LINKS = {
  punjab:   'https://punjabcode.punjab.gov.pk/urdu/index',
  pakistan: 'https://pakistancode.gov.pk',
  supreme:  'https://www.supremecourt.gov.pk',
  lhc:      'https://data.lhc.gov.pk/judgments',
};

async function renderLaw(container) {
  container.innerHTML = `<div id="law-root" style="max-width:none;">
    <div style="text-align:center;padding:20px;color:var(--text-muted);">⏳</div>
  </div>`;
  await _buildLaw();
}

async function _buildLaw() {
  const root = document.getElementById('law-root');
  if (!root) return;

  let laws = [];
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient.from('law_library')
      .select('*').eq('officer_id', oid)
      .neq('category', 'template')
      .order('created_at', { ascending: false });
    laws = data || [];
  } catch(_) {}

  const q = window._lawSearch || '';
  const filtered = q ? laws.filter(l =>
    l.title?.toLowerCase().includes(q.toLowerCase()) ||
    l.content?.toLowerCase().includes(q.toLowerCase())
  ) : laws;

  root.innerHTML = `
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;flex-wrap:wrap;">
    <button onclick="showPage('dashboard',null)" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);">واپس ←</button>
    <div style="flex:1;">
      <div style="font-size:18px;font-weight:800;">⚖️ قانونی لائبریری</div>
      <div style="font-size:12px;color:var(--text-muted);">${laws.length} قوانین · مکمل قانون اپ لوڈ کریں</div>
    </div>
    <button class="btn btn-primary" onclick="_addLaw()">➕ نیا قانون اپ لوڈ کریں</button>
  </div>

  <!-- Search -->
  <div style="position:relative;margin-bottom:14px;">
    <input id="law-q" class="form-input" placeholder="🔍 قانون تلاش کریں..." value="${q}"
      oninput="window._lawSearch=this.value;_buildLaw()" style="padding-right:40px;direction:rtl;">
    ${q?`<button onclick="window._lawSearch='';document.getElementById('law-q').value='';_buildLaw()" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;color:var(--text-muted);font-size:16px;">✕</button>`:''}
  </div>

  ${filtered.length === 0 ? `
  <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
    <div style="font-size:52px;margin-bottom:14px;">⚖️</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;font-family:'Jameel Noori Nastaleeq',serif;">${q ? 'کوئی نتیجہ نہیں' : 'قانونی لائبریری خالی ہے'}</div>
    <div style="font-size:12px;margin-bottom:16px;">${q ? 'دوسرے الفاظ آزمائیں' : 'نیا قانون اپ لوڈ کریں — مکمل PPC، CrPC، CNSA وغیرہ'}</div>
    ${!q?`<button class="btn btn-primary" onclick="_addLaw()">➕ پہلا قانون اپ لوڈ کریں</button>`:''}
  </div>` : `
  <!-- Law List — simple rows, buttons in one line -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
    ${filtered.map((l,i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:${i<filtered.length-1?'1px solid var(--border)':'none'};direction:rtl;flex-wrap:wrap;">
      <div style="font-size:24px;flex-shrink:0;">${l.file_url ? '📄' : '📋'}</div>
      <div style="flex:1;min-width:150px;">
        <div style="font-size:15px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">${l.title}</div>
        <div style="font-size:11px;color:var(--text-muted);">${formatDate(l.created_at)}${l.content?` · ${l.content.length} حروف`:''}</div>
      </div>
      <!-- Buttons in ONE line, left side -->
      <div style="display:flex;gap:5px;flex-shrink:0;direction:rtl;flex-wrap:wrap;">
        ${l.content ? `<button class="btn btn-secondary btn-sm" onclick="_readLaw('${l.id}')" title="پڑھیں">👁️</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="_renameLaw('${l.id}','${(l.title||'').replace(/'/g,'')}')" title="نام تبدیل">✏️</button>
        ${l.content ? `<button class="btn btn-secondary btn-sm" onclick="_printLaw('${l.id}')" title="پرنٹ">🖨️</button>` : ''}
        ${l.file_url ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${l.file_url}')" title="ڈاؤنلوڈ">⬇️</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="_deleteLaw('${l.id}')" title="حذف">🗑️</button>
      </div>
    </div>`).join('')}
  </div>

  <!-- Online resources at the BOTTOM -->
  <div style="margin-top:16px;padding:14px;background:var(--bg-secondary);border-radius:10px;direction:rtl;">
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">🌐 آن لائن قانونی وسائل</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="window.open('${_LAW_LINKS.punjab}')">🔗 Punjab Code</button>
      <button class="btn btn-secondary btn-sm" onclick="window.open('${_LAW_LINKS.pakistan}')">🔗 Pakistan Code</button>
      <button class="btn btn-secondary btn-sm" onclick="window.open('${_LAW_LINKS.supreme}')">🔗 Supreme Court</button>
      <button class="btn btn-secondary btn-sm" onclick="window.open('${_LAW_LINKS.lhc}')">🔗 LHC Judgments</button>
    </div>
  </div>`}`;
}

// ── ADD / UPLOAD LAW ──────────────────────────────────────────
function _addLaw() {
  openModal('➕ نیا قانون اپ لوڈ کریں',
    `<div style="direction:rtl;">
      <label class="form-label">قانون کا نام *</label>
      <input class="form-input" id="nl-title" placeholder="مثلاً پاکستان پینل کوڈ (مکمل)" style="margin-bottom:10px;">
      <label class="form-label">زمرہ</label>
      <select class="form-input" id="nl-cat" style="margin-bottom:10px;">
        <option>PPC</option><option>CrPC</option><option>CNSA</option>
        <option>ہتھیار ایکٹ</option><option>ٹریفک</option><option>سائبر کرائم</option>
        <option>خصوصی قوانین</option><option>دیگر</option>
      </select>
      <label class="form-label">مکمل متن (پورا قانون یہاں پیسٹ کریں)</label>
      <textarea class="form-input" id="nl-content" rows="8"
        placeholder="پورا قانون یہاں لکھیں یا پیسٹ کریں... (دفعات نہیں، مکمل قانون)"
        style="font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;direction:rtl;line-height:2;resize:vertical;"></textarea>
      <div style="margin-top:10px;">
        <label class="form-label">یا PDF / فائل اپ لوڈ کریں</label>
        <input type="file" id="nl-file" accept=".pdf,.doc,.docx,.txt"
          style="width:100%;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
        <div id="nl-progress" style="font-size:11px;color:var(--text-muted);margin-top:4px;"></div>
      </div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="nl-save" onclick="_saveLaw()">💾 اپ لوڈ کریں</button>
    </div>`
  );
}

async function _saveLaw() {
  const title   = document.getElementById('nl-title')?.value.trim();
  const cat     = document.getElementById('nl-cat')?.value || 'دیگر';
  const content = document.getElementById('nl-content')?.value.trim() || '';
  const file    = document.getElementById('nl-file')?.files?.[0];
  const btn     = document.getElementById('nl-save');
  const prog    = document.getElementById('nl-progress');

  if (!title) { showToast('⚠️ قانون کا نام ضروری ہے','error'); return; }
  if (!content && !file) { showToast('⚠️ متن یا فائل ضروری ہے','error'); return; }

  if (btn) { btn.textContent='⏳...'; btn.disabled=true; }
  try {
    const oid = await getOfficerId();
    let fileUrl=null, fileName=null;
    if (file) {
      if (prog) prog.textContent = '📤 فائل اپ لوڈ ہو رہی ہے...';
      const path = `${oid}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error:upErr } = await supabaseClient.storage.from('law-files').upload(path, file);
      if (upErr) throw upErr;
      const { data:urlData } = supabaseClient.storage.from('law-files').getPublicUrl(path);
      fileUrl = urlData.publicUrl; fileName = file.name;
      if (prog) prog.textContent = '✅ فائل اپ لوڈ';
    }
    await supabaseClient.from('law_library').insert({ officer_id:oid, title, category:cat, content, file_url:fileUrl, file_name:fileName });
    closeModal(); showToast('✅ قانون اپ لوڈ ہو گیا','success'); _buildLaw();
  } catch(e) {
    showToast('❌ '+e.message,'error');
    if (btn) { btn.textContent='💾 اپ لوڈ کریں'; btn.disabled=false; }
  }
}

// ── READ ─────────────────────────────────────────────────────
async function _readLaw(id) {
  const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
  if (!data) return;
  openModal(`⚖️ ${data.title}`,
    `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:2.2;max-height:65vh;overflow-y:auto;white-space:pre-wrap;">${data.content||'مواد دستیاب نہیں'}</div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;">
      <button class="btn btn-secondary" onclick="closeModal()">بند</button>
      <button class="btn btn-secondary" onclick="_printLaw('${id}')">🖨️ پرنٹ</button>
      ${data.file_url?`<button class="btn btn-primary" onclick="window.open('${data.file_url}')">⬇️ ڈاؤنلوڈ</button>`:''}
    </div>`
  );
}

// ── PRINT ────────────────────────────────────────────────────
async function _printLaw(id) {
  const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
  if (!data) return;
  const o = currentOfficer||{};
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>@page{margin:20mm;}body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;color:#111;font-size:14px;line-height:2;}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:16px;}
    div{white-space:pre-wrap;word-break:break-word;}
    .footer{font-size:10px;color:#666;text-align:center;margin-top:20px;border-top:1px solid #ccc;padding-top:8px;}</style>
    </head><body>
    <div class="hdr"><h2>محکمہ پولیس پنجاب · قانونی لائبریری</h2>
    <h3>${data.title}</h3></div>
    <div>${(data.content||'').replace(/\n/g,'<br>')}</div>
    <div class="footer">Digital IO · ${new Date().toLocaleDateString('en-PK')}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
}

// ── RENAME ───────────────────────────────────────────────────
function _renameLaw(id, oldName) {
  openModal('✏️ نام تبدیل کریں',
    `<div style="direction:rtl;">
      <label class="form-label">نیا نام</label>
      <input class="form-input" id="law-rename" value="${oldName}">
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doRenameLaw('${id}')">💾 تبدیل</button>
    </div>`
  );
}
async function _doRenameLaw(id) {
  const t = document.getElementById('law-rename')?.value.trim();
  if (!t) return;
  await supabaseClient.from('law_library').update({title:t}).eq('id',id);
  closeModal(); showToast('✅ نام تبدیل','success'); _buildLaw();
}

// ── DELETE ───────────────────────────────────────────────────
function _deleteLaw(id) {
  openModal('🗑️ حذف',
    `<p style="color:var(--red);direction:rtl;">کیا آپ یہ قانون حذف کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-danger" onclick="closeModal();_doDeleteLaw('${id}')">🗑️ حذف</button>
    </div>`
  );
}
async function _doDeleteLaw(id) {
  await supabaseClient.from('law_library').delete().eq('id',id);
  showToast('🗑️ حذف','info'); _buildLaw();
}
