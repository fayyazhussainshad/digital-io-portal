/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — ٹمپلیٹس (Templates)  templates.js
   Ready-made professional Urdu documents officers can edit/copy/print.
   ═══════════════════════════════════════════════════════════════ */

registerPage('templates', renderTemplates);

const TPL_BUCKET = 'template-files';
const TPL_CACHE_KEY = 'cache_templates';
let _tplList = [];
let _tplSearchTmr = null;
let _tplActiveCat = '';

const TPL_CATEGORIES = {
  'darkhwast': 'درخواست',
  'report':    'رپورٹ',
  'khat':      'خط',
  'adaalti':   'عدالتی',
  'notice':    'نوٹس',
  'other':     'دیگر'
};
const TPL_CAT_COLOR = {
  'darkhwast': '#1a73e8', 'report': '#28a745', 'khat': '#6f42c1',
  'adaalti': '#dc3545', 'notice': '#fd7e14', 'other': '#6c757d'
};
function _tplCatLabel(c){ return TPL_CATEGORIES[c] || 'دیگر'; }
function _tplCatColor(c){ return TPL_CAT_COLOR[c] || '#6c757d'; }



// ── PAGE RENDER ──────────────────────────────────────────────
async function renderTemplates(container) {
  container.innerHTML = `
  <div style="max-width:1100px;margin:0 auto;direction:rtl;">
    <div style="display:flex;align-items:center;gap:12px;padding:14px 4px;flex-wrap:wrap;margin-bottom:6px;">
      <div style="font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px;">📄 ٹمپلیٹس</div>
      <input id="tpl-main-search" type="text" dir="rtl" placeholder="ٹمپلیٹ کا نام تلاش کریں..."
        oninput="_tplFilter(this.value)"
        style="flex:1;min-width:180px;padding:10px 16px;border:1px solid var(--border);border-radius:24px;font-size:15px;outline:none;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_openAddTpl()" class="btn btn-primary" style="white-space:nowrap;">+ نیا ٹمپلیٹ شامل کریں</button>
    </div>

    <!-- Category filter chips -->
    <div id="tpl-filter-chips" style="display:flex;gap:6px;flex-wrap:wrap;padding:0 4px 10px;">
      ${_tplChip('', 'سب')}
      ${Object.entries(TPL_CATEGORIES).map(([k,v])=>_tplChip(k,v)).join('')}
    </div>

    <div id="tpl-table-wrap" style="overflow-x:auto;">
      <div style="text-align:center;padding:40px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;

  await _loadTemplates();
  _renderTplTable();
}

function _tplChip(cat, label) {
  const active = _tplActiveCat === cat;
  const color = cat ? _tplCatColor(cat) : 'var(--accent)';
  return `<button onclick="_tplSetCat('${cat}')" style="padding:5px 14px;border-radius:16px;border:1px solid ${active?color:'var(--border)'};background:${active?color:'transparent'};color:${active?'#fff':'var(--text-secondary)'};cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">${label}</button>`;
}

function _tplSetCat(cat) {
  _tplActiveCat = cat;
  // re-render chips + table
  const chips = document.getElementById('tpl-filter-chips');
  if (chips) chips.innerHTML = _tplChip('', 'سب') + Object.entries(TPL_CATEGORIES).map(([k,v])=>_tplChip(k,v)).join('');
  _renderTplTable();
}

// ── LOAD (cache-first, seed defaults) ────────────────────────
async function _loadTemplates() {
  try {
    const cached = JSON.parse(localStorage.getItem(TPL_CACHE_KEY) || '[]');
    if (cached.length) { _tplList = cached; _renderTplTable(); }
  } catch(_) {}

  if (!navigator.onLine) return;
  try {
    const { data, error } = await supabaseClient.from('templates')
      .select('*').order('category', { ascending:true }).order('title', { ascending:true });
    if (error) throw error;
    _tplList = data || [];
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
  } catch(e) {
    console.warn('Templates load failed, using cache:', e.message);
  }
}

// ── TABLE ────────────────────────────────────────────────────
function _renderTplTable() {
  const wrap = document.getElementById('tpl-table-wrap');
  if (!wrap) return;

  let list = _tplList;
  if (_tplActiveCat) list = list.filter(t => t.category === _tplActiveCat);

  if (!list.length) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:var(--text-muted);">
        <div style="font-size:56px;margin-bottom:14px;">📄</div>
        <div style="font-size:17px;font-weight:800;margin-bottom:6px;">کوئی ٹمپلیٹ موجود نہیں</div>
        <div style="font-size:13px;margin-bottom:20px;">+ نیا ٹمپلیٹ شامل کریں بٹن دبائیں</div>
        <button onclick="_openAddTpl()" class="btn btn-primary">+ نیا ٹمپلیٹ</button>
      </div>`;
    return;
  }

  const rows = list.map((t,i) => {
    const cat = _tplCatLabel(t.category);
    const color = _tplCatColor(t.category);
    const title = _tplEsc(t.title||'—');
    const hasFile = !!t.file_url;
    const hasContent = !!t.content;
    return `
    <tr style="border-bottom:1px solid var(--border);">
      <td style="padding:10px 8px;text-align:center;color:var(--text-muted);font-size:13px;">${i+1}</td>
      <td style="padding:10px 8px;text-align:right;font-weight:700;word-break:break-word;">${title}
        ${t.is_default?'<span style="font-size:10px;color:var(--text-faint);font-weight:400;"> · پہلے سے موجود</span>':''}</td>
      <td style="padding:10px 8px;text-align:right;">
        <span style="background:${color}22;color:${color};padding:3px 10px;border-radius:12px;font-size:12px;white-space:nowrap;">${cat}</span>
      </td>
      <td style="padding:10px 8px;text-align:center;">
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">
          <button onclick="_editTpl('${t.id}')" title="دیکھیں" style="${_tplBtn('#1a73e8')}">👁️</button>
          <button onclick="_renameTpl('${t.id}')" title="نام بدلیں" style="${_tplBtn('#fd7e14')}">✏️</button>
          <button onclick="_copyTpl('${t.id}')" title="نقل بنائیں" style="${_tplBtn('#20c997')}">📋</button>
          ${hasFile?`<button onclick="_downloadTpl('${t.id}')" title="ڈاؤنلوڈ" style="${_tplBtn('#28a745')}">⬇️</button>`:''}
          <button onclick="_moveTpl('${t.id}')" title="قسم بدلیں" style="${_tplBtn('#6f42c1')}">📂</button>
          ${(hasContent||hasFile)?`<button onclick="_printTpl('${t.id}')" title="پرنٹ" style="${_tplBtn('#6c757d')}">🖨️</button>`:''}
          <button onclick="_deleteTpl('${t.id}')" title="حذف" style="${_tplBtn('#dc3545')}">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <table style="width:100%;border-collapse:collapse;direction:rtl;background:var(--bg-card);border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:var(--bg-secondary);border-bottom:2px solid var(--border);">
          <th style="padding:11px 8px;text-align:center;width:5%;font-size:13px;">#</th>
          <th style="padding:11px 8px;text-align:right;width:42%;font-size:13px;">ٹمپلیٹ کا نام</th>
          <th style="padding:11px 8px;text-align:right;width:18%;font-size:13px;">قسم</th>
          <th style="padding:11px 8px;text-align:center;width:35%;font-size:13px;">اقدامات</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
function _tplBtn(bg){ return `padding:5px 9px;background:${bg};color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;`; }

// ── SEARCH FILTER ────────────────────────────────────────────
function _tplFilter(val) {
  clearTimeout(_tplSearchTmr);
  _tplSearchTmr = setTimeout(() => {
    const q = (val||'').trim().toLowerCase();
    const wrap = document.getElementById('tpl-table-wrap');
    if (!wrap) return;
    if (!q) { _renderTplTable(); return; }
    let list = _tplList.filter(t =>
      (t.title||'').toLowerCase().includes(q) ||
      _tplCatLabel(t.category).toLowerCase().includes(q) ||
      (t.content||'').toLowerCase().includes(q));
    if (_tplActiveCat) list = list.filter(t => t.category === _tplActiveCat);
    // temporarily render filtered
    const saved = _tplList; _tplList = list; _renderTplTable(); _tplList = saved;
  }, 300);
}

// ── ADD NEW TEMPLATE ─────────────────────────────────────────
function _openAddTpl() {
  openModal('+ نیا ٹمپلیٹ شامل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">ٹمپلیٹ کا نام *</label>
      <input class="form-input" id="tpl-f-title" dir="rtl" placeholder="مثلاً: DSP صاحب کو درخواست" style="margin-bottom:14px;">
      <label class="form-label">📤 ٹمپلیٹ اپلوڈ کریں (PDF / Word)</label>
      <input class="form-input" id="tpl-f-file" type="file" accept=".pdf,.doc,.docx" style="margin-bottom:6px;">
      <div id="tpl-f-fileinfo" style="font-size:12px;color:var(--text-muted);"></div>
      <div id="tpl-f-progress" style="font-size:12px;color:var(--accent);margin-top:8px;"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="tpl-save-btn" onclick="_saveTpl()">💾 محفوظ کریں</button>
    </div>`);
}

async function _saveTpl() {
  const title = document.getElementById('tpl-f-title')?.value.trim();
  const file = document.getElementById('tpl-f-file')?.files?.[0];
  const prog = document.getElementById('tpl-f-progress');
  const btn = document.getElementById('tpl-save-btn');

  if (!title) { showToast('⚠️ ٹمپلیٹ کا نام ضروری ہے','error'); return; }
  if (!file) { showToast('⚠️ ٹمپلیٹ فائل اپلوڈ کریں','error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const oid = await getOfficerId();
    if (prog) prog.textContent = '📤 فائل اپلوڈ ہو رہی ہے...';
    const ext = (file.name.split('.').pop()||'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
    const fileType = (ext==='pdf')?'pdf':'word';
    const fileDisplay = file.name;
    const rand = Math.random().toString(36).substring(2,8);
    const safe = `tpl_${Date.now()}_${rand}.${ext||'pdf'}`;
    const path = `${oid}/${safe}`;
    const { error: upErr } = await supabaseClient.storage.from(TPL_BUCKET).upload(path, file, { contentType:file.type, upsert:true });
    if (upErr) throw upErr;
    const { data:urlData } = supabaseClient.storage.from(TPL_BUCKET).getPublicUrl(path);
    const fileUrl = urlData?.publicUrl || null;

    if (prog) prog.textContent = '💾 محفوظ ہو رہا ہے...';
    const rec = { officer_id:oid, title, category:'other', content:null, file_url:fileUrl, file_name:safe, file_display_name:fileDisplay, safe_file_name:safe, file_type:fileType, is_default:false, is_public:true };
    const { data, error } = await supabaseClient.from('templates').insert(rec).select().single();
    if (error) throw error;
    _tplList.unshift(data);
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
    closeModal();
    showToast('✅ ٹمپلیٹ شامل ہو گیا','success');
    _renderTplTable();
  } catch(e) {
    showToast('❌ ' + (e.message||'محفوظ نہیں ہو سکا'),'error');
    if (btn) { btn.disabled=false; btn.textContent='💾 محفوظ کریں'; }
  }
}

// ── RENAME template name ─────────────────────────────────────
function _renameTpl(id) {
  const t = _tplList.find(x => x.id === id);
  if (!t) return;
  openModal('✏️ ٹمپلیٹ کا نام بدلیں', `
    <div style="direction:rtl;">
      <label class="form-label">ٹمپلیٹ کا نام *</label>
      <input class="form-input" id="tpl-rename-inp" dir="rtl" value="${_tplEsc(t.title||'')}" style="margin-bottom:6px;">
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doRenameTpl('${id}')">💾 محفوظ کریں</button>
    </div>`);
}
async function _doRenameTpl(id) {
  const newName = document.getElementById('tpl-rename-inp')?.value.trim();
  if (!newName) { showToast('⚠️ نام ضروری ہے','error'); return; }
  try {
    await supabaseClient.from('templates').update({ title:newName, updated_at:new Date().toISOString() }).eq('id', id);
    const t = _tplList.find(x=>x.id===id); if (t) t.title = newName;
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
    // Update open viewer title if present
    const vt = document.getElementById('tpl-viewer-title'); if (vt) vt.textContent = newName;
    closeModal();
    showToast('✅ نام تبدیل ہو گیا','success');
    _renderTplTable();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── EDITABLE VIEWER (key feature) ────────────────────────────
function _editTpl(id, autoPrint) {
  const t = _tplList.find(x => x.id === id);
  if (!t) return;

  // If file-based (no text content), open the file instead
  if (!t.content && t.file_url) {
    const isPdf = (t.file_type==='pdf') || t.file_url.toLowerCase().includes('.pdf');
    const ov = document.createElement('div');
    ov.id='tpl-editor-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:99999;background:#fff;display:flex;flex-direction:column;direction:rtl;';
    ov.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#fd7e14;color:#fff;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="window.open('${t.file_url}','_blank')" style="${_tplTbBtn()}">📄 نئے ٹیب میں</button>
          <button onclick="_renameTpl('${t.id}')" style="${_tplTbBtn()}">✏️ نام بدلیں</button>
        </div>
        <div style="font-weight:800;" id="tpl-viewer-title">${_tplEsc(t.title)}</div>
        <button onclick="document.getElementById('tpl-editor-overlay').remove()" style="${_tplTbBtn()}">✕ بند</button>
      </div>
      <iframe src="${t.file_url}#toolbar=1" style="flex:1;border:none;"></iframe>`;
    document.body.appendChild(ov);
    return;
  }

  const ov = document.createElement('div');
  ov.id = 'tpl-editor-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;display:flex;flex-direction:column;direction:rtl;';
  ov.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#fd7e14;color:#fff;flex-shrink:0;flex-wrap:wrap;gap:8px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button onclick="_printTplEditor()" style="${_tplTbBtn()}">🖨️ پرنٹ</button>
        <button onclick="_copyTplEditor()" style="${_tplTbBtn()}">📋 کاپی</button>
        <button onclick="_saveTplEditor('${t.id}')" style="${_tplTbBtn()}">💾 محفوظ</button>
      </div>
      <div style="font-size:15px;font-weight:800;">✏️ ${_tplEsc(t.title)}</div>
      <button onclick="document.getElementById('tpl-editor-overlay').remove()" style="${_tplTbBtn()}">✕ بند</button>
    </div>

    <!-- Editable template name -->
    <div style="padding:10px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border);direction:rtl;">
      <label style="font-size:12px;color:var(--text-muted);">ٹمپلیٹ کا نام:</label>
      <input id="tpl-edit-title" dir="rtl" value="${_tplEsc(t.title||'')}" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:15px;font-weight:700;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq',serif;background:var(--bg-card);color:var(--text-primary);margin-top:3px;">
    </div>

    <!-- Quick fill bar -->
    <div style="padding:8px 16px;background:#fff3cd;border-bottom:1px solid #ffc107;font-size:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;direction:rtl;">
      <strong style="color:#664d03;">فوری بھریں:</strong>
      <input placeholder="[نام ملزم]" dir="rtl" oninput="_tplFill('[نام ملزم]',this.value)" style="${_tplFillInp()}">
      <input placeholder="[تاریخ]" dir="ltr" oninput="_tplFill('[تاریخ]',this.value)" style="${_tplFillInp()}width:110px;">
      <input placeholder="[مقدمہ نمبر]" dir="ltr" oninput="_tplFill('[مقدمہ نمبر]',this.value)" style="${_tplFillInp()}width:110px;">
      <input placeholder="[نام مدعی]" dir="rtl" oninput="_tplFill('[نام مدعی]',this.value)" style="${_tplFillInp()}">
      <input placeholder="[دفعہ]" dir="ltr" oninput="_tplFill('[دفعہ]',this.value)" style="${_tplFillInp()}width:90px;">
    </div>

    <div id="tpl-editable-area" contenteditable="true" dir="rtl"
      style="flex:1;overflow-y:auto;padding:36px 48px;font-size:16px;line-height:2.2;outline:none;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;text-align:right;max-width:820px;margin:0 auto;width:100%;box-sizing:border-box;color:#111;">${_tplContentHtml(t.content||'')}</div>`;
  document.body.appendChild(ov);
  _tplHighlightPlaceholders();
  if (autoPrint) setTimeout(_printTplEditor, 400);
}

// Convert plain text content to HTML (preserve line breaks)
function _tplContentHtml(text) {
  return _tplEsc(text).replace(/\n/g, '<br>');
}

// Highlight [placeholders] in yellow
function _tplHighlightPlaceholders() {
  const area = document.getElementById('tpl-editable-area');
  if (!area) return;
  area.innerHTML = area.innerHTML.replace(/\[([^\]<>]+)\]/g,
    '<mark style="background:#fff3cd;border:1px dashed #ffc107;border-radius:4px;padding:1px 4px;">[$1]</mark>');
}

// Replace a [placeholder] with a typed value (bold blue)
function _tplFill(placeholder, value) {
  const area = document.getElementById('tpl-editable-area');
  if (!area || !value.trim()) return;
  // Work on a fresh copy each time: re-highlight then replace this placeholder
  const safe = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  area.innerHTML = area.innerHTML.replace(
    new RegExp('<mark[^>]*>' + safe + '</mark>', 'g'),
    `<strong style="color:#1a73e8;">${_tplEsc(value)}</strong>`
  ).replace(
    new RegExp(safe, 'g'),
    `<strong style="color:#1a73e8;">${_tplEsc(value)}</strong>`
  );
}

function _printTplEditor() {
  const area = document.getElementById('tpl-editable-area');
  if (!area) return;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:A4;margin:15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:right;font-size:14pt;line-height:2.2;color:#000;}
    mark{background:none!important;border:none!important;}</style></head><body>${area.innerHTML}
    <div style="position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;">Generated by Digital IO</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

function _copyTplEditor() {
  const area = document.getElementById('tpl-editable-area');
  if (!area) return;
  const text = area.innerText || '';
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=>showToast('📋 کاپی ہو گیا','success'));
  else showToast('کاپی دستیاب نہیں','error');
}

async function _saveTplEditor(id) {
  const area = document.getElementById('tpl-editable-area');
  const titleInp = document.getElementById('tpl-edit-title');
  if (!area) return;
  const content = area.innerText || '';
  const title = (titleInp?.value || '').trim();
  if (!title) { showToast('⚠️ ٹمپلیٹ کا نام ضروری ہے','error'); return; }
  try {
    await supabaseClient.from('templates').update({ title, content, updated_at:new Date().toISOString() }).eq('id', id);
    const t = _tplList.find(x=>x.id===id); if (t) { t.content = content; t.title = title; }
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
    showToast('✅ محفوظ ہو گیا','success');
    _renderTplTable();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── COPY (duplicate) ─────────────────────────────────────────
async function _copyTpl(id) {
  const t = _tplList.find(x => x.id === id);
  if (!t) return;
  try {
    const oid = await getOfficerId();
    const rec = { officer_id:oid, title:`${t.title} (نقل)`, category:t.category, content:t.content||null,
      file_url:t.file_url, file_name:t.file_name, file_display_name:t.file_display_name, safe_file_name:t.safe_file_name,
      file_type:t.file_type, is_default:false, is_public:true };
    const { data, error } = await supabaseClient.from('templates').insert(rec).select().single();
    if (error) throw error;
    _tplList.unshift(data);
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
    showToast('✅ نقل بن گئی','success');
    _renderTplTable();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── MOVE (change category) ───────────────────────────────────
function _moveTpl(id) {
  const t = _tplList.find(x => x.id === id);
  if (!t) return;
  openModal('📂 قسم تبدیل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">نئی قسم منتخب کریں</label>
      <select class="form-input" id="tpl-move-cat" style="direction:rtl;">
        ${Object.entries(TPL_CATEGORIES).map(([v,l])=>`<option value="${v}" ${t.category===v?'selected':''}>${l}</option>`).join('')}
      </select>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doMoveTpl('${id}')">منتقل کریں</button>
    </div>`);
}
async function _doMoveTpl(id) {
  const cat = document.getElementById('tpl-move-cat')?.value;
  if (!cat) return;
  try {
    await supabaseClient.from('templates').update({ category:cat, updated_at:new Date().toISOString() }).eq('id', id);
    const t = _tplList.find(x=>x.id===id); if (t) t.category = cat;
    try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
    closeModal();
    showToast('✅ منتقل ہو گیا','success');
    _renderTplTable();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── DOWNLOAD ─────────────────────────────────────────────────
function _downloadTpl(id) {
  const t = _tplList.find(x => x.id === id);
  if (!t || !t.file_url) { showToast('❌ فائل دستیاب نہیں','error'); return; }
  const a = document.createElement('a');
  a.href = t.file_url; a.download = t.file_display_name || t.file_name || t.title; a.target='_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── PRINT ────────────────────────────────────────────────────
function _printTpl(id) { _editTpl(id, true); }

// ── DELETE ───────────────────────────────────────────────────
function _deleteTpl(id) {
  const t = _tplList.find(x => x.id === id);
  if (!t) return;
  const doDelete = async () => {
    try {
      if (t.file_url) {
        const marker = '/' + TPL_BUCKET + '/';
        const idx = t.file_url.indexOf(marker);
        if (idx !== -1) {
          const path = decodeURIComponent(t.file_url.substring(idx+marker.length).split('?')[0]);
          await supabaseClient.storage.from(TPL_BUCKET).remove([path]);
        }
      }
      await supabaseClient.from('templates').delete().eq('id', id);
      _tplList = _tplList.filter(x => x.id !== id);
      try { localStorage.setItem(TPL_CACHE_KEY, JSON.stringify(_tplList)); } catch(_) {}
      showToast('🗑️ حذف ہو گیا','info');
      _renderTplTable();
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };
  if (typeof confirmDelete === 'function') confirmDelete(t.title, doDelete);
  else if (confirm('حذف کریں؟')) doDelete();
}

// ── helpers ──────────────────────────────────────────────────
function _tplTbBtn(){ return 'padding:6px 14px;background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;'; }
function _tplFillInp(){ return 'padding:4px 8px;border:1px solid #dee2e6;border-radius:4px;width:140px;font-size:13px;font-family:\'Jameel Noori Nastaleeq\',serif;'; }
function _tplEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// expose
window.renderTemplates = renderTemplates;
window._tplFilter = _tplFilter;
window._tplSetCat = _tplSetCat;
window._openAddTpl = _openAddTpl;
window._saveTpl = _saveTpl;
window._renameTpl = _renameTpl;
window._doRenameTpl = _doRenameTpl;
window._editTpl = _editTpl;
window._tplFill = _tplFill;
window._printTplEditor = _printTplEditor;
window._copyTplEditor = _copyTplEditor;
window._saveTplEditor = _saveTplEditor;
window._copyTpl = _copyTpl;
window._moveTpl = _moveTpl;
window._doMoveTpl = _doMoveTpl;
window._downloadTpl = _downloadTpl;
window._printTpl = _printTpl;
window._deleteTpl = _deleteTpl;
