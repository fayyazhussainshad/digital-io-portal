/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — احکامات (Orders & SOPs)   ahkamat.js
   ───────────────────────────────────────────────────────────────
   Police رولز، سرکلر، سٹینڈنگ آرڈرز، تفتیشی SOPs ka markazi zakheera.
     • ADMIN / SHO (superadmin) → daal / تبدیل / حذف kar sakta hai
     • Har افسر → sirf پڑھنا / تلاش / پرنٹ
   Storage: Supabase table 'ahkamat' + PRIVATE bucket 'ahkamat'
            (signed URL — dekho ahkamat.sql)
   ═══════════════════════════════════════════════════════════════ */

registerPage('ahkamat', renderAhkamat);

const AHK_BUCKET    = 'ahkamat';
const AHK_CACHE_KEY = 'cache_ahkamat';
let   _ahkList      = [];
let   _ahkSearchTmr = null;
let   _ahkActiveCat = 'all';     // filter chip

// ── 8 درجہ بندیاں (categories) ─────────────────────────────────
const AHK_CATEGORIES = {
  'police_rules':      'پولیس رولز و سٹینڈنگ آرڈرز',
  'igp_circulars':     'IGP / RPO / DPO سرکلر و احکامات',
  'investigation_sops':'تفتیش کے SOPs',
  'forensic':          'فرانزک / PFSA طریقہ کار',
  'crime_sops':        'مخصوص جرائم کے SOPs',
  'human_rights':      'انسانی حقوق و گرفتاری ہدایات',
  'court_orders':      'عدالتی احکامات و مثالیں',
  'misc':              'متفرق / دفتری احکامات'
};
/* Nishan SVG hain — har device par aik jaise, aur theme ke rang le lete hain */
const AHK_CAT_ICON = {
  'police_rules':       "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M4 4.5h6.5a2 2 0 0 1 2 2V20a1.6 1.6 0 0 0-1.6-1.5H4z'/><path d='M20 4.5h-6.5a2 2 0 0 0-2 2V20a1.6 1.6 0 0 1 1.6-1.5H20z'/></svg>",
  'igp_circulars':      "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M6 3.5h10.5v17H6z'/><path d='M9 8h5M9 12h5M9 16h3'/></svg>",
  'investigation_sops': "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg>",
  'forensic':           "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M9.5 3.5v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4A1.5 1.5 0 0 0 19.5 19l-5-9.5v-6'/><path d='M8 3.5h8'/></svg>",
  'crime_sops':         "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 4v16'/><path d='M6 20h12'/><path d='M4 9l3-4 3 4'/><path d='M14 9l3-4 3 4'/></svg>",
  'human_rights':       "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 20.5s-7-4.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11.5c0 4.8-7 9-7 9z'/></svg>",
  'court_orders':       "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 3.5l8.5 4.5h-17z'/><path d='M5.5 10v8M10 10v8M14 10v8M18.5 10v8'/><path d='M3.5 20.5h17'/></svg>",
  'misc':               "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z'/></svg>"
};
function _ahkCatLabel(c){ return AHK_CATEGORIES[c] || 'متفرق / دفتری احکامات'; }
function _ahkCatIcon(c){ return AHK_CAT_ICON[c] || AHK_CAT_ICON.misc; }

// Sirf admin / superadmin content manage kar sakta hai
function _ahkCanManage(){
  try {
    if (typeof hasRole === 'function') return hasRole('admin');
    const r = (typeof currentOfficer!=='undefined' && currentOfficer && currentOfficer.role) || 'officer';
    return r === 'admin' || r === 'superadmin';
  } catch(_) { return false; }
}

// ── PAGE RENDER ────────────────────────────────────────────────
async function renderAhkamat(container){
  const canMng = _ahkCanManage();
  container.innerHTML = `
  <div style="max-width:100%;margin:0;direction:rtl;">
    <!-- سرخی + تلاش + (ایڈمن) شامل -->
    <div class="page-header">
      ${canMng ? `<button onclick="_ahkOpenAdd()" class="btn btn-primary dio-add-btn">+ نیا حکم</button>` : ''}
      <div>
        <div class="page-title">احکامات و ضوابط</div>
        <div class="page-subtitle">سرکلر، احکامات اور طریقہ کار</div>
      </div>
      <input id="ahk-main-search" type="text" dir="rtl" placeholder="عنوان، نمبر یا متن تلاش کریں…"
        oninput="_ahkFilter(this.value)"
        style="flex:1;min-width:180px;padding:10px 16px;border:1px solid var(--border);border-radius:24px;font-size:15px;outline:none;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_ahkPrintList()" class="btn btn-secondary btn-sm" title="موجودہ فہرست پرنٹ کریں">فہرست</button>
    </div>

    <!-- درجہ بندی chips -->
    <div id="ahk-cat-chips" style="display:flex;gap:8px;flex-wrap:wrap;padding:4px 4px 12px;">
      ${_ahkChipsHtml()}
    </div>

    ${!canMng ? `<div style="font-size:11px;color:var(--text-muted);padding:0 4px 8px;">ℹ️ احکامات صرف پڑھنے، تلاش اور پرنٹ کے لیے ہیں۔ نیا حکم صرف ایڈمن/ایس ایچ او شامل کر سکتا ہے۔</div>` : ''}

    <div id="ahk-table-wrap" style="overflow-x:auto;margin:0 -20px;">
      ${(window.DIO && DIO.states) ? DIO.states.loading('احکامات لوڈ ہو رہے ہیں') : '<div style="text-align:center;padding:40px;color:var(--text-muted);width:100%;">لوڈ ہو رہا ہے...</div>'}
    </div>
  </div>`;

  await _ahkLoad();
  _ahkRender();
}

function _ahkChipsHtml(){
  /* Chip ki shakl ab `theme-pro.css` ke `.dio-chip` se aati hai —
     yahan apne rang/naap nahi likhe jate. Teen safhon par teen
     alag chip hoti thin (yahan 18px, templates me 16px + apna rang,
     mulzimaan me class wali) — ab teenon aik jaisi. */
  const mk = (key, label, icon) => {
    const on = (_ahkActiveCat === key);
    return `<button type="button" class="dio-chip${on ? ' active' : ''}"
      aria-pressed="${on}" onclick="_ahkSetCat('${key}')">${icon || ''} ${label}</button>`;
  };
  let html = mk('all','سب','');
  for (const [k,v] of Object.entries(AHK_CATEGORIES)) html += mk(k, v, _ahkCatIcon(k));
  return html;
}

function _ahkSetCat(cat){
  _ahkActiveCat = cat;
  const chips = document.getElementById('ahk-cat-chips');
  if (chips) chips.innerHTML = _ahkChipsHtml();
  _ahkRender();
}

// ── LOAD (cache-first) ─────────────────────────────────────────
async function _ahkLoad(){
  try {
    const cached = JSON.parse(localStorage.getItem(AHK_CACHE_KEY) || '[]');
    if (cached.length) { _ahkList = cached; _ahkRender(); }
  } catch(_){}

  if (!navigator.onLine) return;
  try {
    const { data, error } = await supabaseClient.from('ahkamat')
      .select('*').order('created_at', { ascending:false });
    if (error) throw error;
    _ahkList = data || [];
    try { localStorage.setItem(AHK_CACHE_KEY, JSON.stringify(_ahkList)); } catch(_){}
  } catch(e){
    console.warn('Ahkamat load failed, using cache:', e.message);
  }
}

// current filter (category + search) applied
function _ahkVisible(){
  let list = _ahkList.slice();
  if (_ahkActiveCat !== 'all') list = list.filter(a => (a.category||'misc') === _ahkActiveCat);
  const q = (document.getElementById('ahk-main-search')?.value || '').trim().toLowerCase();
  if (q) {
    list = list.filter(a =>
      (a.title||'').toLowerCase().includes(q) ||
      (a.order_number||'').toLowerCase().includes(q) ||
      (a.issuing_authority||'').toLowerCase().includes(q) ||
      (a.body_text||'').toLowerCase().includes(q) ||
      _ahkCatLabel(a.category).toLowerCase().includes(q));
  }
  return list;
}

// ── TABLE ──────────────────────────────────────────────────────
function _ahkRender(){
  const wrap = document.getElementById('ahk-table-wrap');
  if (!wrap) return;
  const canMng = _ahkCanManage();
  const list = _ahkVisible();

  if (!list.length){
    const empty = !_ahkList.length;
    wrap.innerHTML = `
      <div style="text-align:center;padding:56px 20px;color:var(--text-muted);width:100%;">
        <div style="font-size:60px;margin-bottom:14px;"><svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M8 4h8v3H8z"/><path d="M9 4H6v17h12V4h-3"/><path d="M9 11h6"/><path d="M9 15h6"/></svg></div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">${empty?'ابھی کوئی حکم شامل نہیں':'اس تلاش/درجہ بندی میں کچھ نہیں ملا'}</div>
        <div style="font-size:14px;margin-bottom:${canMng&&empty?'22px':'0'};">${empty?'احکامات، سرکلر اور SOPs یہاں محفوظ ہوں گے':'دوسری درجہ بندی یا تلاش آزمائیں'}</div>
        ${canMng&&empty?`<button onclick="_ahkOpenAdd()" class="btn btn-primary">+ پہلا حکم شامل کریں</button>`:''}
      </div>`;
    return;
  }

  const rows = list.map((a,i)=>{
    const hasFile = !!(a.storage_path || a.file_url);
    const hasText = !!(a.body_text && a.body_text.trim());
    const title = _ahkEsc(a.title || '—');
    const cat   = _ahkCatLabel(a.category);
    const meta  = [
      a.order_number ? `نمبر: ${_ahkEsc(a.order_number)}` : '',
      a.issuing_authority ? _ahkEsc(a.issuing_authority) : '',
      a.issue_date ? _ahkFmtDate(a.issue_date) : ''
    ].filter(Boolean).join(' · ');
    return `
    <tr id="ahk-row-${a.id}" style="border-bottom:1px solid var(--border);">
      <td style="padding:10px 8px;text-align:center;color:var(--text-muted);font-size:13px;">${i+1}</td>
      <td style="padding:10px 8px;text-align:right;font-weight:700;word-break:break-word;">
        ${title}
        ${meta?`<div style="font-size:11px;color:var(--text-muted);font-weight:400;margin-top:2px;">${meta}</div>`:''}
      </td>
      <td style="padding:10px 8px;text-align:right;">
        <span style="background:rgba(56,189,248,0.12);color:var(--accent);padding:3px 10px;border-radius:12px;font-size:12px;white-space:nowrap;">${_ahkCatIcon(a.category)} ${_ahkEsc(cat)}</span>
      </td>
      <td style="padding:10px 8px;text-align:center;">
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">
          ${(hasText||hasFile)?`<button aria-label="پڑھیں" onclick="_ahkView('${a.id}')" title="پڑھیں" style="padding:5px 9px;background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:6px;cursor:pointer;font-size:13px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button>`:''}
          ${(hasText||hasFile)?`<button aria-label="پرنٹ" onclick="_ahkView('${a.id}',true)" title="پرنٹ" style="padding:5px 9px;background:var(--text-secondary);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg></button>`:''}
          ${canMng?`<button aria-label="ترمیم" onclick="_ahkEdit('${a.id}')" title="ترمیم" style="padding:5px 9px;background:var(--amber);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>`:''}
          ${canMng?`<button aria-label="حذف" onclick="_ahkDelete('${a.id}')" title="حذف" style="padding:5px 9px;background:var(--red);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>`:''}
        </div>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <table style="width:100%;border-collapse:collapse;direction:rtl;background:var(--bg-card);border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:var(--bg-secondary);border-bottom:2px solid var(--border);">
          <th style="padding:11px 8px;text-align:center;width:5%;font-size:13px;">#</th>
          <th style="padding:11px 8px;text-align:right;width:47%;font-size:13px;">عنوان</th>
          <th style="padding:11px 8px;text-align:right;width:22%;font-size:13px;">درجہ بندی</th>
          <th style="padding:11px 8px;text-align:center;width:26%;font-size:13px;">اقدامات</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── SEARCH (debounced) ─────────────────────────────────────────
function _ahkFilter(){
  clearTimeout(_ahkSearchTmr);
  _ahkSearchTmr = setTimeout(_ahkRender, 250);
}

// ── ADD MODAL (admin) ──────────────────────────────────────────
function _ahkOpenAdd(){
  if (!_ahkCanManage()) { showToast('صرف ایڈمن/ایس ایچ او نیا حکم شامل کر سکتا ہے','error'); return; }
  openModal('+ نیا حکم / SOP شامل کریں', _ahkFormHtml(null),
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="ahk-save-btn" onclick="_ahkSave()">محفوظ کریں</button>
    </div>`);
}

function _ahkEdit(id){
  if (!_ahkCanManage()) { showToast('صرف ایڈمن/ایس ایچ او ترمیم کر سکتا ہے','error'); return; }
  const a = _ahkList.find(x=>x.id===id);
  if (!a) return;
  openModal('حکم میں ترمیم', _ahkFormHtml(a),
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="ahk-save-btn" onclick="_ahkSave('${id}')">محفوظ کریں</button>
    </div>`);
}

function _ahkFormHtml(a){
  const v = (x)=> _ahkEsc(x==null?'':x);
  return `
    <div style="direction:rtl;">
      <label class="form-label">عنوان *</label>
      <input class="form-input" id="ahk-f-title" dir="rtl" value="${v(a&&a.title)}" placeholder="مثلاً: گرفتاری کے وقت حقوق کی پابندی" style="margin-bottom:10px;">

      <label class="form-label">درجہ بندی</label>
      <select class="form-input" id="ahk-f-category" style="margin-bottom:10px;direction:rtl;">
        ${Object.entries(AHK_CATEGORIES).map(([val,lbl])=>`<option value="${val}" ${a&&a.category===val?'selected':''}>${_ahkCatIcon(val)} ${lbl}</option>`).join('')}
      </select>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div style="flex:1;min-width:140px;">
          <label class="form-label">حکم / سرکلر نمبر</label>
          <input class="form-input" id="ahk-f-number" dir="rtl" value="${v(a&&a.order_number)}" placeholder="مثلاً: 1234/PB" style="margin-bottom:10px;">
        </div>
        <div style="flex:1;min-width:140px;">
          <label class="form-label">تاریخِ اجرا</label>
          <input class="form-input" id="ahk-f-date" type="date" dir="ltr" value="${v(a&&a.issue_date)}" style="margin-bottom:10px;text-align:left;">
        </div>
      </div>

      <label class="form-label">جاری کنندہ</label>
      <input class="form-input" id="ahk-f-authority" dir="rtl" value="${v(a&&a.issuing_authority)}" placeholder="مثلاً: IGP پنجاب / RPO / معزز عدالت" style="margin-bottom:10px;">

      <label class="form-label">متن (اردو) — یا نیچے فائل منسلک کریں</label>
      <textarea class="form-input" id="ahk-f-body" dir="rtl" rows="5" placeholder="حکم / SOP کا مکمل متن یہاں لکھیں..." style="margin-bottom:10px;font-family:'Jameel Noori Nastaleeq',serif;line-height:2;">${v(a&&a.body_text)}</textarea>

      <label class="form-label">منسلک فائل (PDF / Word) — اختیاری</label>
      ${a&&a.file_display_name?`<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">موجودہ: ${v(a.file_display_name)}</div>`:''}
      <input class="form-input" id="ahk-f-file" type="file" accept=".pdf,.doc,.docx" style="margin-bottom:6px;">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">متن یا فائل — کم از کم ایک ضرور دیں۔</div>
      <div id="ahk-f-progress" style="font-size:12px;color:var(--accent);margin-top:4px;"></div>
    </div>`;
}

async function _ahkSave(id){
  if (!_ahkCanManage()) { showToast('اجازت نہیں','error'); return; }
  const title     = document.getElementById('ahk-f-title')?.value.trim();
  const category  = document.getElementById('ahk-f-category')?.value || 'misc';
  const number    = document.getElementById('ahk-f-number')?.value.trim();
  const dateVal   = document.getElementById('ahk-f-date')?.value || null;
  const authority = document.getElementById('ahk-f-authority')?.value.trim();
  const body      = document.getElementById('ahk-f-body')?.value.trim();
  const file      = document.getElementById('ahk-f-file')?.files?.[0];
  const prog      = document.getElementById('ahk-f-progress');
  const btn       = document.getElementById('ahk-save-btn');
  const existing  = id ? _ahkList.find(x=>x.id===id) : null;

  if (!title) { showToast('عنوان ضروری ہے','error'); return; }
  const hadFile = existing && (existing.storage_path || existing.file_url);
  if (!body && !file && !hadFile) { showToast('متن یا فائل میں سے کم از کم ایک ضروری ہے','error'); return; }
  if (!navigator.onLine) { showToast('احکامات شامل/تبدیل کرنے کے لیے انٹرنیٹ ضروری ہے','error'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const rec = {
      title, category,
      order_number: number || null,
      issuing_authority: authority || null,
      issue_date: dateVal || null,
      body_text: body || null,
      updated_at: new Date().toISOString()
    };

    if (file) {
      if (prog) prog.textContent = 'فائل اپلوڈ ہو رہی ہے...';
      const ext  = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
      const rand = Math.random().toString(36).substring(2,8);
      const safe = `ahk_${Date.now()}_${rand}.${ext || 'pdf'}`;
      const path = safe;   // bucket-root; policies bucket-level hain
      const { error: upErr } = await supabaseClient.storage.from(AHK_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      rec.storage_path      = path;
      rec.file_name         = safe;
      rec.file_display_name = file.name;
      rec.file_type         = (ext === 'pdf') ? 'pdf' : 'word';
      rec.file_url          = null;   // private bucket → signed URL on demand
    }

    if (prog) prog.textContent = 'محفوظ ہو رہا ہے...';

    let saved;
    if (id) {
      const { data, error } = await supabaseClient.from('ahkamat').update(rec).eq('id', id).select().single();
      if (error) throw error;
      saved = data;
      const idx = _ahkList.findIndex(x=>x.id===id);
      if (idx !== -1) _ahkList[idx] = saved;
    } else {
      try { rec.created_by = (typeof currentUser!=='undefined' && currentUser) ? currentUser.id : null; } catch(_){}
      const { data, error } = await supabaseClient.from('ahkamat').insert(rec).select().single();
      if (error) throw error;
      saved = data;
      _ahkList.unshift(saved);
    }

    try { localStorage.setItem(AHK_CACHE_KEY, JSON.stringify(_ahkList)); } catch(_){}
    closeModal();
    showToast(id?'ترمیم محفوظ ہو گئی':'حکم شامل ہو گیا','success');
    _ahkRender();
  } catch(e){
    showToast('' + (e.message || 'محفوظ نہیں ہو سکا'),'error');
    if (btn) { btn.disabled = false; btn.textContent = 'محفوظ کریں'; }
  }
}

// ── SIGNED URL (private bucket) ────────────────────────────────
async function _ahkFileUrl(a){
  if (a && a.storage_path) {
    try {
      const { data, error } = await supabaseClient.storage.from(AHK_BUCKET).createSignedUrl(a.storage_path, 3600);
      if (!error && data && data.signedUrl) return data.signedUrl;
    } catch(_){}
  }
  return (a && a.file_url) || null;
}

// ── VIEW / READ (body_text reader OR file) ─────────────────────
async function _ahkView(id, autoPrint){
  const a = _ahkList.find(x=>x.id===id);
  if (!a) return;
  const hasText = !!(a.body_text && a.body_text.trim());

  // Agar text hai → hamesha andar reader mein dikhao (aur print bhi wahi se)
  if (hasText) { _ahkTextReader(a, autoPrint); return; }

  // Warna file kholo (signed URL)
  const url = await _ahkFileUrl(a);
  if (!url) { showToast('اس حکم کے ساتھ کوئی متن یا فائل موجود نہیں','error'); return; }
  const isPdf = (a.file_type === 'pdf') || url.toLowerCase().includes('.pdf');
  _ahkFileReader(a, url, isPdf, autoPrint);
}

function _ahkCloseReader(){
  const ov = document.getElementById('ahk-reader-overlay');
  if (ov) ov.remove();
}

// Text reader — internal search + print
function _ahkTextReader(a, autoPrint){
  const overlay = document.createElement('div');
  overlay.id = 'ahk-reader-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,16,25,0.97);display:flex;flex-direction:column;';
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-bottom:1px solid #dee2e6;direction:rtl;flex-wrap:wrap;">
      <div style="font-weight:800;font-size:16px;color:var(--text-primary);flex:1;min-width:140px;">${_ahkEsc(a.title)}</div>
      <input id="ahk-internal-search" type="text" dir="rtl" placeholder="متن میں تلاش کریں..." oninput="_ahkInternalSearch(this.value)"
        style="padding:7px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;min-width:150px;">
      <button onclick="_ahkNavMatch(-1)" title="پچھلا" aria-label="پچھلا" style="border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);border-radius:8px;padding:6px 9px;cursor:pointer;display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
      <button onclick="_ahkNavMatch(1)" title="اگلا" aria-label="اگلا" style="border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);border-radius:8px;padding:6px 9px;cursor:pointer;display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <span id="ahk-search-count" style="font-size:12px;color:#6c757d;"></span>
      <button onclick="_ahkPrintOne('${a.id}')" style="background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;">پرنٹ</button>
      <button onclick="_ahkCloseReader()" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:700;">بند</button>
    </div>
    <div id="ahk-reader-body" style="flex:1;overflow:auto;background:#fff;">
      <style>
        #ahk-html-content{max-width:850px;margin:0 auto;padding:28px 24px;background:#fff;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2.1;color:#111;}
        #ahk-html-content .ahk-meta{font-size:13px;color:#555;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:16px;line-height:1.9;}
        #ahk-html-content p{unicode-bidi:plaintext;margin:0 0 10px;}
        #ahk-html-content mark.ahk-hl{background:#ffeb3b;color:#000;}
      </style>
      <div id="ahk-html-content">
        <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">${_ahkEsc(a.title)}</h2>
        <div class="ahk-meta">
          ${_ahkCatIcon(a.category)} ${_ahkEsc(_ahkCatLabel(a.category))}
          ${a.order_number?` — حکم/سرکلر نمبر: <b>${_ahkEsc(a.order_number)}</b>`:''}
          ${a.issuing_authority?`<br>جاری کنندہ: ${_ahkEsc(a.issuing_authority)}`:''}
          ${a.issue_date?`<br>تاریخِ اجرا: ${_ahkEsc(_ahkFmtDate(a.issue_date))}`:''}
        </div>
        ${_ahkBodyToHtml(a.body_text)}
        ${(a.storage_path||a.file_url)?`<div style="margin-top:20px;"><button onclick="_ahkOpenFile('${a.id}')" style="background:var(--green);color:#fff;border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:14px;">منسلک فائل کھولیں</button></div>`:''}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  if (autoPrint) setTimeout(()=>_ahkPrintOne(a.id), 300);
}

// File reader (PDF via PDF.js if available, else options)
async function _ahkFileReader(a, url, isPdf, autoPrint){
  const overlay = document.createElement('div');
  overlay.id = 'ahk-reader-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,16,25,0.97);display:flex;flex-direction:column;';
  const gview = 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true';
  overlay.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-bottom:1px solid #dee2e6;direction:rtl;flex-wrap:wrap;">
      <div style="font-weight:800;font-size:16px;color:var(--text-primary);flex:1;min-width:140px;">${_ahkEsc(a.title)}</div>
      <a href="${url}" target="_blank" style="background:var(--accent);color:#fff;border-radius:8px;padding:7px 12px;text-decoration:none;font-size:13px;">براؤزر</a>
      <a href="${gview}" target="_blank" style="background:#ea4335;color:#fff;border-radius:8px;padding:7px 12px;text-decoration:none;font-size:13px;">Google Docs</a>
      <a href="${url}" download="${_ahkEsc(a.file_display_name||a.title||'ahkam')}" style="background:var(--green);color:#fff;border-radius:8px;padding:7px 12px;text-decoration:none;font-size:13px;">ڈاؤنلوڈ</a>
      <button onclick="_ahkCloseReader()" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:700;">بند</button>
    </div>
    <div id="ahk-reader-body" style="flex:1;overflow:auto;background:#fff;">
      <div style="text-align:center;padding:40px;color:#6c757d;">فائل کھل رہی ہے...</div>
    </div>`;
  document.body.appendChild(overlay);
  const body = document.getElementById('ahk-reader-body');

  if (isPdf && typeof _ensurePdfJs === 'function') {
    try {
      const pdfjsLib = await _ensurePdfJs();
      const resp = await fetch(url, { mode:'cors' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buf = await resp.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const w = document.createElement('div');
      w.style.cssText = 'max-width:900px;margin:0 auto;padding:16px 8px;';
      body.innerHTML = ''; body.appendChild(w);
      const scale = (window.innerWidth < 768) ? 1.1 : 1.7;
      for (let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const cv = document.createElement('canvas');
        cv.style.cssText = 'display:block;margin:0 auto 14px;max-width:100%;box-shadow:0 2px 10px rgba(0,0,0,0.25);background:#fff;';
        cv.width = viewport.width; cv.height = viewport.height;
        w.appendChild(cv);
        await page.render({ canvasContext: cv.getContext('2d'), viewport }).promise;
      }
      if (autoPrint) setTimeout(()=>window.open(url,'_blank'), 300);
      return;
    } catch(_){ /* fall through to options */ }
  }

  if (!isPdf && typeof mammoth !== 'undefined') {
    try {
      const resp = await fetch(url, { mode:'cors' });
      const buf = await resp.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buf });
      body.innerHTML = `
        <style>
          #ahk-html-content{max-width:850px;margin:0 auto;padding:28px 24px;background:#fff;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2;color:#111;}
          #ahk-html-content table{width:100%;border-collapse:collapse;direction:rtl;margin:12px 0;}
          #ahk-html-content td,#ahk-html-content th{border:1px solid #000;padding:6px 10px;text-align:right;}
          #ahk-html-content p,#ahk-html-content td{unicode-bidi:plaintext;}
        </style>
        <div id="ahk-html-content">${result.value ? (window.DIO&&DIO.html&&DIO.html.safe?DIO.html.safe(result.value):esc(result.value)) : 'مواد دستیاب نہیں'}</div>`;
      if (autoPrint) setTimeout(()=>window.print(), 400);
      return;
    } catch(_){}
  }

  // Fallback: reliable open options
  body.innerHTML = `
    <div style="text-align:center;padding:50px 20px;direction:rtl;">
      <div style="font-size:44px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></div>
      <div style="font-size:15px;color:#444;margin-bottom:20px;">فائل کھولنے کے لیے منتخب کریں:</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a href="${url}" target="_blank" style="padding:11px 20px;background:var(--accent);color:#fff;border-radius:8px;text-decoration:none;">براؤزر میں کھولیں</a>
        <a href="${gview}" target="_blank" style="padding:11px 20px;background:#ea4335;color:#fff;border-radius:8px;text-decoration:none;">Google Docs</a>
        <a href="${url}" download style="padding:11px 20px;background:var(--green);color:#fff;border-radius:8px;text-decoration:none;">ڈاؤنلوڈ</a>
      </div>
    </div>`;
}

// Open just the attached file from the text reader
async function _ahkOpenFile(id){
  const a = _ahkList.find(x=>x.id===id);
  if (!a) return;
  const url = await _ahkFileUrl(a);
  if (!url) { showToast('فائل دستیاب نہیں','error'); return; }
  window.open(url, '_blank');
}

// Plain body text → safe paragraphs
function _ahkBodyToHtml(txt){
  if (!txt) return '';
  return String(txt).split(/\n{2,}/).map(block =>
    '<p>' + _ahkEsc(block).replace(/\n/g,'<br>') + '</p>'
  ).join('');
}

// ── INTERNAL SEARCH (text reader) ──────────────────────────────
let _ahkCurMatch = 0;
function _ahkInternalSearch(term){
  const content = document.getElementById('ahk-html-content');
  const countEl = document.getElementById('ahk-search-count');
  if (!content) return;
  if (content._origHtml === undefined) content._origHtml = content.innerHTML;
  const q = (term||'').trim();
  _ahkCurMatch = 0;
  if (!q) { content.innerHTML = content._origHtml; if (countEl) countEl.textContent=''; return; }
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex = new RegExp('(' + safe + ')','gi');
  // sirf text nodes highlight — tags na toote is liye simple replace on _origHtml
  content.innerHTML = content._origHtml.replace(/>([^<]+)</g, (m, t) =>
    '>' + t.replace(regex, '<mark class="ahk-hl">$1</mark>') + '<');
  const marks = content.querySelectorAll('mark.ahk-hl');
  if (countEl) countEl.textContent = marks.length ? `1/${marks.length}` : 'کوئی نتیجہ نہیں';
  if (marks[0]) { marks[0].style.background='#ff9800'; marks[0].scrollIntoView({behavior:'smooth',block:'center'}); }
}
function _ahkNavMatch(dir){
  const content = document.getElementById('ahk-html-content');
  const countEl = document.getElementById('ahk-search-count');
  if (!content) return;
  const marks = content.querySelectorAll('mark.ahk-hl');
  if (!marks.length) return;
  marks[_ahkCurMatch].style.background = '#ffeb3b';
  _ahkCurMatch = (_ahkCurMatch + dir + marks.length) % marks.length;
  const cur = marks[_ahkCurMatch];
  cur.style.background = '#ff9800';
  cur.scrollIntoView({behavior:'smooth',block:'center'});
  if (countEl) countEl.textContent = `${_ahkCurMatch+1}/${marks.length}`;
}

// ── PRINT one order (text) ─────────────────────────────────────
function _ahkPrintOne(id){
  const a = _ahkList.find(x=>x.id===id);
  if (!a) { showToast('پرنٹ کے لیے مواد نہیں','error'); return; }
  if (!(a.body_text && a.body_text.trim())) {
    // no text → open file for printing
    _ahkOpenFile(id); return;
  }
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:right;font-size:14px;line-height:2.1;color:#111;}
      h1{font-size:19px;text-align:center;margin:0 0 6px;}
      .ahk-meta{font-size:12px;color:#444;text-align:center;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:14px;line-height:1.8;}
      p{margin:0 0 10px;unicode-bidi:plaintext;}
      .ahk-print-footer{position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;}
    </style></head><body>
    <h1>${_ahkEsc(a.title)}</h1>
    <div class="ahk-meta">
      ${_ahkEsc(_ahkCatLabel(a.category))}
      ${a.order_number?` · حکم/سرکلر نمبر: ${_ahkEsc(a.order_number)}`:''}
      ${a.issuing_authority?` · جاری کنندہ: ${_ahkEsc(a.issuing_authority)}`:''}
      ${a.issue_date?` · تاریخِ اجرا: ${_ahkEsc(_ahkFmtDate(a.issue_date))}`:''}
    </div>
    ${_ahkBodyToHtml(a.body_text)}
    <div class="ahk-print-footer">${_ahkFooterText()}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

// ── PRINT the current (filtered) list ──────────────────────────
function _ahkPrintList(){
  const list = _ahkVisible();
  if (!list.length) { showToast('پرنٹ کے لیے کوئی حکم نہیں','error'); return; }
  const catTitle = _ahkActiveCat==='all' ? 'تمام درجہ بندیاں' : _ahkCatLabel(_ahkActiveCat);
  const rows = list.map((a,i)=>`
    <tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #000;padding:6px;">${_ahkEsc(a.title)}</td>
      <td style="border:1px solid #000;padding:6px;">${_ahkEsc(_ahkCatLabel(a.category))}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${_ahkEsc(a.order_number||'—')}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${a.issue_date?_ahkEsc(_ahkFmtDate(a.issue_date)):'—'}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;color:#111;}
      h2{text-align:center;margin-bottom:4px;}
      .sub{text-align:center;font-size:13px;color:#444;margin-bottom:14px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{border:1px solid #000;padding:6px;background:#f0f0f0;}
      .ahk-print-footer{position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;}
    </style></head><body>
    <h2>احکامات (Orders / SOPs) — Digital IO</h2>
    <div class="sub">${_ahkEsc(catTitle)}</div>
    <table>
      <tr><th style="width:7%;">نمبر</th><th>عنوان</th><th style="width:22%;">درجہ بندی</th><th style="width:15%;">حکم نمبر</th><th style="width:14%;">تاریخ</th></tr>
      ${rows}
    </table>
    <div class="ahk-print-footer">${_ahkFooterText()}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

// ── DELETE (admin) ─────────────────────────────────────────────
function _ahkDelete(id){
  if (!_ahkCanManage()) { showToast('صرف ایڈمن/ایس ایچ او حذف کر سکتا ہے','error'); return; }
  const a = _ahkList.find(x=>x.id===id);
  if (!a) return;
  const doDelete = async () => {
    if (!navigator.onLine) { showToast('حذف کرنے کے لیے انٹرنیٹ ضروری ہے','error'); return; }
    try {
      if (a.storage_path) { try { await supabaseClient.storage.from(AHK_BUCKET).remove([a.storage_path]); } catch(_){} }
      const { error } = await supabaseClient.from('ahkamat').delete().eq('id', id);
      if (error) throw error;
      _ahkList = _ahkList.filter(x=>x.id!==id);
      try { localStorage.setItem(AHK_CACHE_KEY, JSON.stringify(_ahkList)); } catch(_){}
      _ahkRender();
      showToast('حذف ہو گیا','info');
    } catch(e){ showToast(''+(e.message||'حذف ناکام'),'error'); }
  };
  if (typeof confirmDelete === 'function') confirmDelete(a.title, doDelete);
  else if (confirm('حذف کریں؟')) doDelete();
}

// ── helpers ────────────────────────────────────────────────────
function _ahkFmtDate(d){
  if (!d) return '';
  try {
    if (typeof dioFormatDate === 'function') return dioFormatDate(d);
    const dt = new Date(d);
    if (!isNaN(dt)) return dt.toLocaleDateString('en-GB'); // dd/mm/yyyy
  } catch(_){}
  return String(d);
}
function _ahkFooterText(){
  let rank='', name='';
  try {
    const o = JSON.parse(localStorage.getItem('officer_profile')||localStorage.getItem('dio_officer_cache')||'{}');
    rank = o.rank || o.designation || '';
    name = o.name || o.full_name || '';
  } catch(_){}
  const who = [rank, name].filter(Boolean).join(' ');
  return who ? `Digital IO — احکامات · ${who}` : 'Digital IO — احکامات';
}
function _ahkEsc(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── expose for inline handlers ─────────────────────────────────
window.renderAhkamat      = renderAhkamat;
window._ahkFilter         = _ahkFilter;
window._ahkSetCat         = _ahkSetCat;
window._ahkOpenAdd        = _ahkOpenAdd;
window._ahkEdit           = _ahkEdit;
window._ahkSave           = _ahkSave;
window._ahkView           = _ahkView;
window._ahkCloseReader    = _ahkCloseReader;
window._ahkOpenFile       = _ahkOpenFile;
window._ahkInternalSearch = _ahkInternalSearch;
window._ahkNavMatch       = _ahkNavMatch;
window._ahkPrintOne       = _ahkPrintOne;
window._ahkPrintList      = _ahkPrintList;
window._ahkDelete         = _ahkDelete;
