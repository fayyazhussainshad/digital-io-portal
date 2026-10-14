/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — قانونی لائبریری (Law Library)  law-library.js
   Upload / read / search / print full law documents (PPC, CrPC...)
   ═══════════════════════════════════════════════════════════════ */

registerPage('law', renderLawLibrary);

const LAW_BUCKET = 'law-library';
const LAW_CACHE_KEY = 'cache_law_library';
let _lawList = [];
let _lawSearchTmr = null;

// Law categories (4 types)
const LAW_CATEGORIES = {
  'ppc':           'تعزیرات پاکستان (PPC)',
  'crpc':          'ضابطہ فوجداری (CrPC)',
  'local_special': 'مقامی و خصوصی قوانین',
  'other':         'دیگر'
};
function _lawCatLabel(c) { return LAW_CATEGORIES[c] || (c && c !== 'قانون' ? c : 'دیگر'); }

/* ═══════════════════════════════════════════════════════════
   FAIL KI APNI HAALAT (filter state)
   Qanooni library ki chhaan-been sirf isi file mein rehti hai —
   koi doosra safha is object ko nahi chhoota, aur yeh kisi doosre
   safhe ki haalat nahi paRhta. Har chip SIRF apna khana bharti hai:
   `cat` chip → cat, talash ka khana → q. Dono raste aik hi jagah
   se guzarte hain: _lawVisible() → _lawRender().
   ═══════════════════════════════════════════════════════════ */
const _lawFilterState = { cat: '', q: '' };

function _lawVisible() {
  const q = _lawFilterState.q, cat = _lawFilterState.cat;
  return _lawList.filter(l => {
    if (cat && (l.category || 'other') !== cat) return false;
    if (!q) return true;
    return (String(l.title || l.name || '')).toLowerCase().includes(q)
        || (String(l.description || '')).toLowerCase().includes(q)
        || _lawCatLabel(l.category).toLowerCase().includes(q);
  });
}
function _lawRender() { _renderLawCards(_lawVisible()); _lawPaintChips(); }

// Chip ki shakl `theme-pro.css` ke `.dio-chip` se aati hai — har safhe par aik jaisi
function _lawChipsHtml() {
  const mk = (key, label) => {
    const on = (_lawFilterState.cat === key);
    return `<button type="button" class="dio-chip${on ? ' active' : ''}" aria-pressed="${on}"
      data-lawcat="${key}" onclick="_lawSetCat('${key}')">${label}</button>`;
  };
  return `<div id="law-chips" style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px;">
    ${mk('', 'تمام')}${Object.entries(LAW_CATEGORIES).map(([v, l]) => mk(v, l)).join('')}
  </div>`;
}
function _lawPaintChips() {
  const wrap = document.getElementById('law-chips');
  if (!wrap) return;
  wrap.querySelectorAll('.dio-chip').forEach(b => {
    const on = (b.getAttribute('data-lawcat') || '') === _lawFilterState.cat;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function _lawSetCat(cat) { _lawFilterState.cat = cat || ''; _lawRender(); }

// ── PAGE RENDER ──────────────────────────────────────────────
async function renderLawLibrary(container) {
  container.innerHTML = `
  <div style="max-width:100%;margin:0;direction:rtl;">
    <!-- Header: search + add -->
    <div class="page-header">
      <button onclick="_openAddLaw()" class="btn btn-primary dio-add-btn">+ نیا قانون</button>
      <div>
        <div class="page-title">قانونی لائبریری</div>
        <div class="page-subtitle">قوانین، ضوابط اور حوالہ جاتی مواد</div>
      </div>
      <input id="law-main-search" type="text" dir="rtl" placeholder="قانون کا نام یا دفعہ تلاش کریں…"
        oninput="_lawFilter(this.value)"
        style="flex:1;min-width:180px;padding:10px 16px;border:1px solid var(--border);border-radius:24px;font-size:15px;outline:none;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_printAllLaws()" class="btn btn-secondary btn-sm" title="پوری فہرست پرنٹ کریں">فہرست</button>
    </div>

    ${_lawChipsHtml()}

    <div id="law-table-wrap" style="overflow-x:auto;">
      ${(window.DIO && DIO.states) ? DIO.states.loading('قانونی لائبریری لوڈ ہو رہی ہے') : '<div style="text-align:center;padding:40px;color:var(--text-muted);width:100%;">لوڈ ہو رہا ہے...</div>'}
    </div>
  </div>`;

  await _loadLaws();
  _lawRender();
}

// ── LOAD (cache-first) ───────────────────────────────────────
async function _loadLaws() {
  // Show cache immediately
  try {
    const cached = JSON.parse(localStorage.getItem(LAW_CACHE_KEY) || '[]');
    if (cached.length) { _lawList = cached; _lawRender(); }
  } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }

  if (!navigator.onLine) return;
  try {
    const { data, error } = await supabaseClient.from('law_library')
      .select('*').order('created_at', { ascending:false });
    if (error) throw error;
    _lawList = data || [];
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  } catch(e) {
    console.warn('Law load failed, using cache:', e.message);
  }
}

// ── TABLE (one law per row) ──────────────────────────────────
// Har amal ke bton ki shakl aik hi jagah se — safhe bhar aik jaisi
function _lawIconBtn(colour) {
  return `display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;`
       + `background:${colour};color:#fff;border:1px solid ${colour};border-radius:8px;cursor:pointer;`;
}

function _renderLawCards(list) {
  const wrap = document.getElementById('law-table-wrap');
  if (!wrap) return;

  if (!list || !list.length) {
    // Chhaan-been lagi ho to "khali library" kehna ghalat hoga
    const filtered = !!(_lawFilterState.cat || _lawFilterState.q);
    wrap.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);width:100%;">
        <div style="margin-bottom:16px;"><svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M4 5h6v15H4z"/><path d="M10 5h6v15h-6z"/><path d="M16.2 5.6l3.6.9-3.2 14-3.5-.9"/></svg></div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">${filtered ? 'اس چھان بین پر کوئی قانون نہیں' : 'قانونی لائبریری خالی ہے'}</div>
        <div style="font-size:14px;margin-bottom:24px;">${filtered ? 'کوئی دوسری قسم چنیں یا تلاش خالی کریں' : 'پہلا قانون شامل کرنے کے لیے اوپر والا بٹن دبائیں'}</div>
        ${filtered
          ? `<button onclick="_lawClearFilter()" class="btn btn-secondary">چھان بین ہٹائیں</button>`
          : `<button onclick="_openAddLaw()" class="btn btn-primary">+ پہلا قانون شامل کریں</button>`}
      </div>`;
    return;
  }

  const rows = list.map((l, i) => {
    const hasFile = !!l.file_url;
    const hasLink = !!l.online_link;
    const title = _lawEsc(l.title || l.name || '—');
    const cat = _lawCatLabel(l.category);
    const kind = hasFile ? (_lawExt(l) === 'pdf' ? 'PDF' : 'Word') : (hasLink ? 'آن لائن' : '—');
    return `
    <tr id="law-row-${l.id}" data-law-name="${title}" data-category="${_lawEsc(cat)}">
      <td class="dio-col-num">${i+1}</td>
      <td style="font-weight:700;word-break:break-word;">${title}
        ${l.description?`<div style="font-size:11px;color:var(--text-muted);font-weight:400;">${_lawEsc(l.description)}</div>`:''}</td>
      <td><span class="dio-tag">${_lawEsc(cat)}</span></td>
      <td style="white-space:nowrap;color:var(--text-muted);font-size:12px;">${kind}</td>
      <td>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
          ${hasFile?`<button aria-label="پڑھیں" onclick="_viewLaw('${l.id}')" title="پڑھیں" style="${_lawIconBtn('var(--accent)')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg></button>`:''}
          ${hasFile?`<button aria-label="ڈاؤنلوڈ" onclick="_downloadLaw('${l.id}')" title="ڈاؤنلوڈ" style="${_lawIconBtn('var(--green)')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/></svg></button>`:''}
          ${hasLink?`<button aria-label="آن لائن" onclick="_lawOpenLink('${l.id}')" title="آن لائن" style="${_lawIconBtn('var(--purple, #6f42c1)')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.4 6.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0L5 12.6a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg></button>`:''}
          <button aria-label="ترمیم" onclick="_editLaw('${l.id}')" title="ترمیم" style="${_lawIconBtn('var(--amber)')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
          <button aria-label="حذف" onclick="_deleteLaw('${l.id}')" title="حذف" style="${_lawIconBtn('var(--red)')}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // `data-table` — isi se theme ke rang, satron ki dhaariyan aur MOBILE par
  // card-shakl (mobile.js `dio-cards` lagata hai) aati hai. Pehle yeh table
  // apne inline rang leti thi, is liye mobile par bagal mein khiskti thi.
  wrap.innerHTML = `
    <table class="data-table" style="width:100%;min-width:720px;">
      <thead>
        <tr>
          <th class="dio-col-num" style="width:5%;">#</th>
          <th style="width:40%;">قانون کا نام</th>
          <th style="width:20%;">قسم</th>
          <th style="width:10%;">فائل</th>
          <th style="width:25%;">اقدامات</th>
        </tr>
      </thead>
      <tbody id="law-table-body">${rows}</tbody>
    </table>`;
}

// ── SEARCH FILTER (debounced) ────────────────────────────────
function _lawFilter(val) {
  clearTimeout(_lawSearchTmr);
  _lawSearchTmr = setTimeout(() => {
    _lawFilterState.q = String(val || '').trim().toLowerCase();
    _lawRender();
  }, 250);
}
function _lawClearFilter() {
  _lawFilterState.cat = ''; _lawFilterState.q = '';
  const s = document.getElementById('law-main-search'); if (s) s.value = '';
  _lawRender();
}
// Link safe tareeqe se — pehle URL seedha onclick mein likha tha (quote se tootta tha)
function _lawOpenLink(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.online_link) return;
  const u = String(l.online_link);
  if (!/^https?:\/\//i.test(u)) { showToast('لنک درست نہیں','error'); return; }
  window.open(u, '_blank', 'noopener');
}

// ── ADD NEW LAW MODAL ────────────────────────────────────────
function _openAddLaw() {
  openModal('+ نیا قانون شامل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">قانون کا نام *</label>
      <input class="form-input" id="law-f-name" placeholder="مثلاً: تعزیرات پاکستان (PPC)" dir="rtl" style="margin-bottom:10px;">
      <label class="form-label">قسم</label>
      <select class="form-input" id="law-f-category" style="margin-bottom:10px;direction:rtl;">
        ${Object.entries(LAW_CATEGORIES).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
      <label class="form-label">تفصیل (اختیاری)</label>
      <textarea class="form-input" id="law-f-desc" placeholder="مثلاً: پاکستان پینل کوڈ 1860" dir="rtl" rows="2" style="margin-bottom:10px;"></textarea>
      <label class="form-label">فائل (PDF / Word)</label>
      <input class="form-input" id="law-f-file" type="file" accept=".pdf,.doc,.docx" style="margin-bottom:10px;">
      <label class="form-label">آن لائن لنک (اختیاری)</label>
      <input class="form-input" id="law-f-link" placeholder="https://..." dir="ltr" style="text-align:left;">
      <div id="law-f-progress" style="font-size:12px;color:var(--accent);margin-top:8px;"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="law-save-btn" onclick="_saveLaw()">محفوظ کریں</button>
    </div>`);
}

async function _saveLaw() {
  const name = document.getElementById('law-f-name')?.value.trim();
  const desc = document.getElementById('law-f-desc')?.value.trim();
  const link = document.getElementById('law-f-link')?.value.trim();
  const category = document.getElementById('law-f-category')?.value || 'other';
  const fileInp = document.getElementById('law-f-file');
  const file = fileInp?.files?.[0];
  const prog = document.getElementById('law-f-progress');
  const btn = document.getElementById('law-save-btn');

  if (!name) { showToast('قانون کا نام ضروری ہے','error'); return; }
  if (!file && !link) { showToast('فائل یا آن لائن لنک میں سے کم از کم ایک ضروری ہے','error'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const oid = await getOfficerId();
    let fileUrl = null, fileName = null, fileType = null, fileDisplay = null;

    if (file) {
      if (prog) prog.textContent = 'فائل اپلوڈ ہو رہی ہے...';
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
      fileType = (ext === 'pdf') ? 'pdf' : 'word';
      fileDisplay = file.name;                      // original (Urdu) name — for display
      // Storage key MUST be pure ASCII (no Urdu/Arabic, spaces, commas) — Supabase rejects otherwise
      const rand = Math.random().toString(36).substring(2, 8);
      const safe = `law_${Date.now()}_${rand}.${ext || 'pdf'}`;
      fileName = safe;                              // clean name stored
      const path = `${oid}/${safe}`;
      // AHEM: `file.type` par bharosa nahi. Kai Android file-picker isay KHALI
      // dete hain → Supabase `text/plain` likh deta hai → baad mein wohi file
      // kholne par AJEEB HUROOF. Extension se sahi qisam khud tay karte hain.
      const ctype = LAW_MIME[ext] || file.type || 'application/octet-stream';
      const { error: upErr } = await supabaseClient.storage.from(LAW_BUCKET).upload(path, file, { contentType: ctype, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from(LAW_BUCKET).getPublicUrl(path);
      fileUrl = urlData?.publicUrl || null;
    }

    if (prog) prog.textContent = 'محفوظ ہو رہا ہے...';
    const rec = { officer_id: oid, title: name, category: category, description: desc||null, file_url: fileUrl, file_name: fileName, file_display_name: fileDisplay, safe_file_name: fileName, file_type: fileType, is_public: true, online_link: link||null };
    let { data, error } = await supabaseClient.from('law_library').insert(rec).select().single();
    // If file_display_name column doesn't exist yet, retry without it
    if (error && error.message && error.message.toLowerCase().includes('file_display_name')) {
      delete rec.file_display_name;
      const r2 = await supabaseClient.from('law_library').insert(rec).select().single();
      data = r2.data; error = r2.error;
    }
    if (error) throw error;

    _lawList.unshift(data);
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    closeModal();
    showToast('قانون شامل ہو گیا','success');
    _lawRender();
  } catch(e) {
    showToast('' + (e.message||'محفوظ نہیں ہو سکا'),'error');
    if (btn) { btn.disabled = false; btn.textContent = 'محفوظ کریں'; }
  }
}

// ── VIEW / READ LAW (full-screen reader) ─────────────────────
// Bottom-sheet options — reliable file access (esp. mobile): browser / Google Docs / download
function _lawOptions(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.file_url) return;
  const gview = 'https://docs.google.com/viewer?url=' + encodeURIComponent(l.file_url) + '&embedded=true';
  const sheet = document.createElement('div');
  sheet.id = 'law-options-sheet';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;';
  // Pehle yahan `background:#fff` pakka likha tha magar likhayi `var(--text-primary)`
  // se aati thi — TAREEK theme par safed kaghaz par safed likhayi, kuch nazar
  // nahi aata tha. Ab dono theme ke khanon se.
  sheet.innerHTML = `
    <div style="width:100%;background:var(--bg-card);color:var(--text-primary);border:1px solid var(--border);border-bottom:none;border-radius:16px 16px 0 0;padding:18px;direction:rtl;max-height:70vh;overflow-y:auto;">
      <div style="width:40px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 14px;"></div>
      <div style="font-size:15px;font-weight:800;text-align:center;margin-bottom:14px;color:var(--text-primary);">${_lawEsc(l.title||l.name)}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="${_lawEsc(l.file_url)}" target="_blank" rel="noopener" onclick="_closeLawOptions()" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--accent);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;"><span style="font-size:20px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 3.1 2.6 13.9 0 17"/><path d="M12 3.5c-2.6 3.1-2.6 13.9 0 17"/></svg></span> براؤزر میں کھولیں</a>
        <a href="${_lawEsc(gview)}" target="_blank" rel="noopener" onclick="_closeLawOptions()" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#ea4335;color:#fff;border-radius:10px;text-decoration:none;font-size:15px;"><span style="font-size:20px;"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></span> Google Docs میں دیکھیں</a>
        <button type="button" onclick="_closeLawOptions();_downloadLaw('${l.id}')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--green);color:#fff;border:none;border-radius:10px;text-align:right;font-size:15px;cursor:pointer;font-family:inherit;"><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:middle"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/></svg></span> ڈاؤنلوڈ کریں (${_lawEsc(_lawFileName(l))})</button>
        ${l.online_link?`<button type="button" onclick="_closeLawOptions();_lawOpenLink('${l.id}')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--purple, #6f42c1);color:#fff;border:none;border-radius:10px;text-align:right;font-size:15px;cursor:pointer;font-family:inherit;"><span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:middle"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4L11.4 6.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0L5 12.6a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg></span> آن لائن لنک</button>`:''}
        <button onclick="_closeLawOptions()" style="padding:13px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;font-size:15px;cursor:pointer;color:var(--text-secondary);font-family:inherit;">منسوخ</button>
      </div>
      <div style="font-size:11.5px;color:var(--text-muted);text-align:center;margin-top:12px;line-height:1.7;">
        ایک بار کھولنے کے بعد یہ فائل آف لائن بھی کھلتی ہے۔<br>
        اردو فونٹ ہر آلے پر ایک جیسا رہے — اس کے لیے <b>PDF</b> بنائیں (پڑھنے والے صفحے پر «پرنٹ» → PDF محفوظ کریں)۔
      </div>
    </div>`;
  sheet.addEventListener('click', e => { if (e.target === sheet) _closeLawOptions(); });
  document.body.appendChild(sheet);
}
function _closeLawOptions() {
  const s = document.getElementById('law-options-sheet');
  if (s) s.remove();
}

function _closeLawReader() {
  const ov = document.getElementById('law-reader-overlay');
  if (ov) {
    if (ov._blobUrl) { try { URL.revokeObjectURL(ov._blobUrl); } catch(_) { /* blob pehle hi aazad ho to koi baat nahi */ } }
    ov.remove();
  }
}

function _viewLaw(id, autoPrint) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.file_url) { showToast('فائل دستیاب نہیں','error'); return; }
  const isPdf = (l.file_type === 'pdf') || l.file_url.toLowerCase().includes('.pdf');

  const overlay = document.createElement('div');
  overlay.id = 'law-reader-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,16,25,0.97);display:flex;flex-direction:column;';
  overlay.innerHTML = `
    <!-- Header — rang theme ke khanon se (pehle pakka safed tha, tareek
         theme par safed patti par safed likhayi = kuch nazar nahi aata tha) -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-card);color:var(--text-primary);border-bottom:1px solid var(--border);direction:rtl;flex-wrap:wrap;">
      <div style="font-weight:800;font-size:16px;color:var(--text-primary);flex:1;min-width:140px;">${_lawEsc(l.title||l.name)}</div>
      ${!isPdf ? `<input id="law-internal-search" type="text" dir="rtl" placeholder="سیکشن تلاش کریں... (مثلاً 302)" oninput="_lawInternalSearch(this.value)" style="padding:7px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;min-width:160px;">
      <button onclick="_lawNavMatch(-1)" title="پچھلا" aria-label="پچھلا" style="border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);border-radius:8px;padding:6px 9px;cursor:pointer;display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
      <button onclick="_lawNavMatch(1)" title="اگلا" aria-label="اگلا" style="border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-primary);border-radius:8px;padding:6px 9px;cursor:pointer;display:inline-flex;align-items:center;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <span id="law-search-count" style="font-size:12px;color:#6c757d;"></span>` : ''}
      <button onclick="_lawOptions('${l.id}')" title="اختیارات" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:7px 12px;cursor:pointer;font-size:13px;">⋯ اختیارات</button>
      <button onclick="_printLawReader()" style="background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;">پرنٹ</button>
      <button onclick="_closeLawReader()" style="background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:700;">بند</button>
    </div>
    <!-- Body -->
    <div id="law-reader-body" style="flex:1;overflow:auto;background:#fff;">
      <div style="text-align:center;padding:40px;color:#6c757d;">کھل رہا ہے...</div>
    </div>`;
  document.body.appendChild(overlay);

  const body = document.getElementById('law-reader-body');
  if (isPdf) {
    _renderPdfLaw(l.file_url, body, autoPrint);
  } else {
    // Word file → render via mammoth (loaded on demand)
    _renderWordLaw(l.file_url, body, autoPrint);
  }
}

// Render PDF by fetching it as a blob first — this makes it same-origin,
// which avoids the "content blocked" error inside the installed PWA.
// Shared PDF.js loader (loads once)
function _ensurePdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (window._pdfJsLoading) return window._pdfJsLoading;
  window._pdfJsLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      res(window.pdfjsLib);
    };
    s.onerror = () => rej(new Error('pdfjs load failed'));
    document.head.appendChild(s);
  });
  return window._pdfJsLoading;
}

// Render PDF using PDF.js → canvas pages. NO iframe, so "content blocked" can never happen.
async function _renderPdfLaw(url, body, autoPrint) {
  body.innerHTML = `<div style="text-align:center;padding:40px;color:#6c757d;">فائل کھل رہی ہے...</div>`;
  try {
    const pdfjsLib = await _ensurePdfJs();
    const resp = await fetch(url, { mode:'cors' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const buf = await resp.arrayBuffer();
    // Apne origin ka blob rakh lo — isi se chhapai hoti hai (naya tab bhi
    // "content blocked" nahi dikhata) aur `_closeLawReader` isay chhoR deta hai.
    try {
      const ov = document.getElementById('law-reader-overlay');
      if (ov) { ov._blobUrl = URL.createObjectURL(new Blob([buf.slice(0)], { type:'application/pdf' })); }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    const wrap = document.createElement('div');
    wrap.id = 'law-pdf-pages';
    wrap.style.cssText = 'max-width:900px;margin:0 auto;padding:16px 8px;';
    body.innerHTML = '';
    body.appendChild(wrap);

    const scale = (window.innerWidth < 768) ? 1.1 : 1.7;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'display:block;margin:0 auto 14px;max-width:100%;box-shadow:0 2px 10px rgba(0,0,0,0.25);background:#fff;';
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      wrap.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
    if (autoPrint) setTimeout(() => window.open(url, '_blank'), 300);
  } catch(e) {
    // Last-resort: give reliable options (never a blank/blocked screen)
    body.innerHTML = `
      <div style="text-align:center;padding:50px 20px;direction:rtl;">
        <div style="font-size:44px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></div>
        <div style="font-size:15px;color:#444;margin-bottom:20px;">فائل ان لائن کھولیں:</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a href="${_lawEsc(url)}" target="_blank" rel="noopener" style="padding:11px 20px;background:var(--accent);color:#fff;border-radius:8px;text-decoration:none;">براؤزر میں کھولیں</a>
          <a href="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true" target="_blank" style="padding:11px 20px;background:#ea4335;color:#fff;border-radius:8px;text-decoration:none;">Google Docs</a>
          <button type="button" onclick="_lawDirectDownload(this.dataset.u)" data-u="${_lawEsc(url)}" style="padding:11px 20px;background:var(--green);color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:15px;">ڈاؤنلوڈ</button>
        </div>
      </div>`;
  }
}

// Lazy-load mammoth from CDN, convert Word → HTML
async function _renderWordLaw(url, body, autoPrint) {
  try {
    if (typeof mammoth === 'undefined') {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const resp = await fetch(url, { mode:'cors' });
    const buf = await resp.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buf }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "table => table", "tr => tr", "td => td",
        "b => strong", "i => em", "u => u"
      ],
      convertImage: mammoth.images.imgElement(image =>
        image.read("base64").then(b => ({ src:`data:${image.contentType};base64,${b}` })))
    });
    body.innerHTML = `
      <style>
        #law-html-content{max-width:850px;margin:0 auto;padding:28px 24px;background:#fff;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2;color:#111;}
        #law-html-content table{width:100%;border-collapse:collapse;direction:rtl;margin:12px 0;}
        #law-html-content td,#law-html-content th{border:1px solid #000;padding:6px 10px;text-align:right;direction:rtl;vertical-align:top;}
        #law-html-content h1{font-size:20px;font-weight:bold;}#law-html-content h2{font-size:18px;font-weight:bold;}#law-html-content h3{font-size:16px;font-weight:bold;}
        #law-html-content p,#law-html-content td,#law-html-content span{unicode-bidi:plaintext;}
        #law-html-content img{max-width:100%;}
        #law-html-content hr{border:none;border-top:1px solid #000;margin:12px 0;}
      </style>
      <div id="law-html-content">${result.value ? (window.DIO&&DIO.html&&DIO.html.safe?DIO.html.safe(result.value):esc(result.value)) : '<div style="text-align:center;color:#999;">مواد دستیاب نہیں</div>'}</div>`;
    if (autoPrint) setTimeout(_printLawReader, 300);
  } catch(e) {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:#6c757d;">
      <div style="font-size:40px;margin-bottom:12px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></div>
      <div style="margin-bottom:16px;">فائل اس براؤزر میں نہیں کھل سکی</div>
      <button onclick="window.open(this.dataset.u,'_blank','noopener')" data-u="${_lawEsc(url)}" style="background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:8px;padding:10px 20px;cursor:pointer;">نئے ٹیب میں کھولیں</button>
    </div>`;
  }
}

// Internal section/article search (Word HTML only) — highlight + count + navigation
let _lawCurrentMatch = 0;
function _lawInternalSearch(term) {
  const content = document.getElementById('law-html-content');
  const countEl = document.getElementById('law-search-count');
  if (!content) return;
  // Reset previous highlights
  if (content._origHtml === undefined) content._origHtml = content.innerHTML;
  const q = (term||'').trim();
  _lawCurrentMatch = 0;
  if (!q) { content.innerHTML = content._origHtml; if (countEl) countEl.textContent=''; return; }
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(' + safe + ')', 'gi');
  content.innerHTML = content._origHtml.replace(regex, '<mark class="law-hl" style="background:#ffeb3b;color:#000;">$1</mark>');
  const marks = content.querySelectorAll('mark.law-hl');
  if (countEl) countEl.textContent = marks.length ? `1/${marks.length}` : 'کوئی نتیجہ نہیں';
  if (marks[0]) { marks[0].style.background='#ff9800'; marks[0].scrollIntoView({ behavior:'smooth', block:'center' }); }
}

// Jump to next/previous match
function _lawNavMatch(dir) {
  const content = document.getElementById('law-html-content');
  const countEl = document.getElementById('law-search-count');
  if (!content) return;
  const marks = content.querySelectorAll('mark.law-hl');
  if (!marks.length) return;
  marks[_lawCurrentMatch].style.background = '#ffeb3b';            // reset old
  _lawCurrentMatch = (_lawCurrentMatch + dir + marks.length) % marks.length;
  const cur = marks[_lawCurrentMatch];
  cur.style.background = '#ff9800';                                // highlight current
  cur.scrollIntoView({ behavior:'smooth', block:'center' });
  if (countEl) countEl.textContent = `${_lawCurrentMatch+1}/${marks.length}`;
}

/* Print whatever is open in the reader.
   PEHLE KHARAB THA: yeh `law-pdf-viewer` naam ka iframe dhoondta tha jo ab
   mojood hi nahi (PDF ab PDF.js ke canvas par banti hai) — is liye PDF wale
   qanoon par «پرنٹ» dabane se sirf "پرنٹ کے لیے مواد نہیں" aata tha.
   Ab: PDF ka apna blob nayi window mein — uska font PDF ke ANDAR hai, is liye
   woh kisi aale par nahi tootta. Word wale qanoon ke liye poora Urdu font
   chhapai ke safhe mein saath bhejte hain (dekhen `dioFontHead`). */
function _printLawReader() {
  const ov = document.getElementById('law-reader-overlay');
  const pages = document.getElementById('law-pdf-pages');
  if (pages) {
    if (ov && ov._blobUrl) {
      const w = window.open(ov._blobUrl, '_blank', 'noopener');
      if (!w) showToast('براؤزر نے نیا صفحہ روک دیا — «اختیارات» سے کھولیں','warn', 4500);
      return;
    }
    // Blob na ho (purana kiash) — canvas ki tasveeren chhap do
    const imgs = Array.from(pages.querySelectorAll('canvas')).slice(0, 40).map(c => {
      try { return `<img src="${c.toDataURL('image/jpeg', 0.85)}">`; } catch (_) { return ''; }
    }).join('');
    if (!imgs) { showToast('پرنٹ کے لیے مواد نہیں','error'); return; }
    const phtml = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <style>@page{size:A4;margin:8mm;}body{margin:0;}img{width:100%;display:block;page-break-after:always;}</style>
      </head><body>${imgs}</body></html>`;
    if (typeof dioPrint === 'function') dioPrint(phtml);
    return;
  }
  const content = document.getElementById('law-html-content');
  if (!content) { showToast('پرنٹ کے لیے مواد نہیں','error'); return; }
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    ${typeof dioFontHead === 'function' ? dioFontHead() : ''}
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:right;font-size:14px;line-height:2;color:#111;}
      table{width:100%;border-collapse:collapse;direction:rtl;}
      td,th{border:1px solid #000;padding:6px 10px;text-align:right;vertical-align:top;}
      p,td,span{unicode-bidi:plaintext;}
      img{max-width:100%;}
      .law-print-footer{position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;}
    </style></head><body>
    ${content.innerHTML}
    <div class="law-print-footer">${_lawFooterText()}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

// Print the whole law list
function _printAllLaws() {
  // Jo safhe par nazar aa raha hai wohi chhapta hai (chhaan-been ke sath)
  const list = _lawVisible();
  if (!list.length) { showToast('کوئی قانون موجود نہیں','error'); return; }
  const rows = list.map((l,i) => `
    <tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #000;padding:6px;">${_lawEsc(l.title||l.name)}</td>
      <td style="border:1px solid #000;padding:6px;">${_lawEsc(_lawCatLabel(l.category))}</td>
      <td style="border:1px solid #000;padding:6px;">${_lawEsc(l.description||'—')}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${l.file_url?'فائل':(l.online_link?'آن لائن':'—')}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    ${typeof dioFontHead === 'function' ? dioFontHead() : ''}
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;color:#111;}
      h2{text-align:center;margin-bottom:14px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{border:1px solid #000;padding:6px;background:#f0f0f0;}
      .law-print-footer{position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;}
    </style></head><body>
    <h2>قانونی لائبریری — Digital IO</h2>
    <table>
      <tr><th style="width:8%;">نمبر</th><th>قانون کا نام</th><th style="width:20%;">قسم</th><th>تفصیل</th><th style="width:12%;">فائل</th></tr>
      ${rows}
    </table>
    <div class="law-print-footer">${_lawFooterText()}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

/* ═══════════════════════════════════════════════════════════
   DOWNLOAD — "زبان اور فونٹ نہ ٹوٹے"

   Purani kharabiyan (asli browser mein naapi gayi thin):

   1) `a.download` DOOSRE origin ki file par browser NAZAR-ANDAAZ kar
      deta hai (Supabase storage app ka origin nahi hai). Natija: afsar
      ko "تعزیرات پاکستان.docx" nahi, `law_1750000000_ab12cd.docx`
      milta tha — yaani naam ka pata hi nahi chalta tha.
   2) `target="_blank"` download ko rok kar naya tab khol deta tha.
   3) Extension kho jaane ka khatra: agar naam `file_display_name` ke
      bajaye `title` se banta (Urdu unwan, bina .pdf/.docx) to file
      bina extension mehfooz hoti — phone/computer usay "text" samajh
      kar kholta aur AJEEB HUROOF nazar aate. Yehi asli shikayat thi.
   4) Server ka Content-Type ghalat ho (kai Android file-picker
      `file.type` khali deta hai → `text/plain`) to Word/PDF bhi
      kachre ki tarah khulti hai.

   Ab: file ko FETCH kar ke apne hi origin ka blob banate hain (is par
   `download` hamesha chalta hai), MIME khud sahi lagate hain, aur naam
   ke aakhir mein sahi extension ki ZAMANAT dete hain.
   ═══════════════════════════════════════════════════════════ */
const LAW_MIME = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  rtf:  'application/rtf',
  txt:  'text/plain;charset=utf-8',
  html: 'text/html;charset=utf-8'
};

// Sach-much ki extension — pehle ASCII wala mehfooz naam, phir URL, phir qisam
function _lawExt(l) {
  const from = s => { const m = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(String(s || '').trim()); return m ? m[1].toLowerCase() : ''; };
  return from(l.file_name) || from(l.safe_file_name) || from(l.file_display_name)
      || from(String(l.file_url || '').split('?')[0])
      || (l.file_type === 'word' ? 'docx' : 'pdf');
}

// Naam: Urdu rehne do (afsar isi se pehchanta hai) magar file-system ke
// mana karda huroof nikaal do aur extension ki zamanat do.
function _lawFileName(l) {
  const ext = _lawExt(l);
  let base = String(l.file_display_name || l.title || l.name || 'law').trim();
  base = base.replace(/\.[a-z0-9]{2,5}$/i, '');                 // purani extension hata do
  base = base.replace(/[\\/:*?"<>|#%]/g, ' ')                    // Windows/Android par mana
             .replace(/[\u0000-\u001f\u007f]/g, ' ')
             .replace(/\s+/g, ' ').trim();
  if (base.length > 80) base = base.slice(0, 80).trim();
  if (!base) base = 'law';
  return base + '.' + ext;
}

async function _downloadLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.file_url) { showToast('فائل دستیاب نہیں','error'); return; }
  const ext  = _lawExt(l);
  const name = _lawFileName(l);
  const mime = LAW_MIME[ext] || 'application/octet-stream';
  showToast('فائل تیار ہو رہی ہے…','info');
  try {
    const resp = await fetch(l.file_url, { mode:'cors' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const buf = await resp.arrayBuffer();
    if (!buf || !buf.byteLength) throw new Error('empty');
    // Server jo bhi Content-Type kahe, hum sahi qisam lagate hain
    const url = URL.createObjectURL(new Blob([buf], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch(_) { /* blob pehle hi aazad ho to koi baat nahi */ } }, 60000);
    showToast('محفوظ ہو گئی: ' + name, 'success');
  } catch (e) {
    // Aakhri sahara — magar afsar ko saaf bata do ke kya hua
    showToast(navigator.onLine ? 'براہِ راست محفوظ نہ ہو سکی — فائل نئے صفحے میں کھل رہی ہے'
                               : 'آف لائن — پہلے ایک بار آن لائن کھولنا ضروری ہے', 'warn', 4500);
    if (navigator.onLine) window.open(l.file_url, '_blank', 'noopener');
  }
}

// ── RENAME (inline) ──────────────────────────────────────────
// ── FULL EDIT MODAL ──────────────────────────────────────────
function _editLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l) return;
  openModal('قانون میں ترمیم', `
    <div style="direction:rtl;">
      <label class="form-label">قانون کا نام *</label>
      <input class="form-input" id="law-e-name" dir="rtl" value="${_lawEsc(l.title||l.name||'')}" style="margin-bottom:10px;">
      <label class="form-label">قسم</label>
      <select class="form-input" id="law-e-category" style="margin-bottom:10px;direction:rtl;">
        ${Object.entries(LAW_CATEGORIES).map(([v,lbl])=>`<option value="${v}" ${l.category===v?'selected':''}>${lbl}</option>`).join('')}
      </select>
      <label class="form-label">تفصیل (اختیاری)</label>
      <textarea class="form-input" id="law-e-desc" dir="rtl" rows="2" style="margin-bottom:10px;">${_lawEsc(l.description||'')}</textarea>
      <label class="form-label">فائل تبدیل کریں (اختیاری)</label>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">موجودہ: ${l.file_display_name?_lawEsc(l.file_display_name):'کوئی فائل نہیں'}</div>
      <input class="form-input" id="law-e-file" type="file" accept=".pdf,.doc,.docx" style="margin-bottom:10px;">
      <label class="form-label">آن لائن لنک (اختیاری)</label>
      <input class="form-input" id="law-e-link" dir="ltr" value="${_lawEsc(l.online_link||'')}" placeholder="https://..." style="text-align:left;">
      <div id="law-e-progress" style="font-size:12px;color:var(--accent);margin-top:8px;"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="law-edit-save-btn" onclick="_saveEditedLaw('${id}')">محفوظ کریں</button>
    </div>`);
}

async function _saveEditedLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l) return;
  const name = document.getElementById('law-e-name')?.value.trim();
  const category = document.getElementById('law-e-category')?.value || 'other';
  const desc = document.getElementById('law-e-desc')?.value.trim();
  const link = document.getElementById('law-e-link')?.value.trim();
  const file = document.getElementById('law-e-file')?.files?.[0];
  const prog = document.getElementById('law-e-progress');
  const btn = document.getElementById('law-edit-save-btn');

  if (!name) { showToast('قانون کا نام ضروری ہے','error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const oid = await getOfficerId();
    const upd = { title: name, category, description: desc||null, online_link: link||null, updated_at: new Date().toISOString() };

    if (file) {
      if (prog) prog.textContent = 'نئی فائل اپلوڈ ہو رہی ہے...';
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
      const rand = Math.random().toString(36).substring(2, 8);
      const safe = `law_${Date.now()}_${rand}.${ext || 'pdf'}`;
      const path = `${oid}/${safe}`;
      const ctype = LAW_MIME[ext] || file.type || 'application/octet-stream';
      const { error: upErr } = await supabaseClient.storage.from(LAW_BUCKET).upload(path, file, { contentType: ctype, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from(LAW_BUCKET).getPublicUrl(path);
      upd.file_url = urlData?.publicUrl || null;
      upd.file_name = safe;
      upd.safe_file_name = safe;
      upd.file_display_name = file.name;
      upd.file_type = (ext === 'pdf') ? 'pdf' : 'word';
    }

    // v547: 0 قطار (RLS/کسی اور کا ریکارڈ) بھی ناکامی — ورنہ «محفوظ» کا جھوٹا پیغام
    dioWriteOk(await supabaseClient.from('law_library').update(upd).eq('id', id).select('id'), 'law update', true);

    // Update local list
    Object.assign(l, upd);
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    closeModal();
    showToast('ترمیم محفوظ ہو گئی','success');
    _lawRender();
  } catch(e) {
    showToast('' + (e.message||'ترمیم ناکام'),'error');
    if (btn) { btn.disabled = false; btn.textContent = 'محفوظ کریں'; }
  }
}

/* MURDA CODE HATAYA: `_renameLaw()` `law-card-<id>` aur `.law-card-name`
   dhoondta tha — dono card-wale purane design ke the jo table se badal
   gaya. Yaani yeh function kabhi chal hi nahi sakta tha. Naam badalne ka
   kaam «ترمیم» (`_editLaw`) se hota hai. */

// ── DELETE (with confirmation) ───────────────────────────────
function _deleteLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l) return;
  const doDelete = async () => {
    try {
      // v547: پہلے ریکارڈ (نتیجہ دیکھ کر)، پھر فائل — پہلے فائل مٹتی اور ریکارڈ کا
      //   حذف رد ہوتا تو قانون فہرست میں رہ جاتا مگر اس کی فائل ضائع۔
      dioWriteOk(await supabaseClient.from('law_library').delete().eq('id', id).select('id'), 'law delete', true);
      // Remove file from storage if present
      if (l.file_url) {
        const marker = '/' + LAW_BUCKET + '/';
        const idx = l.file_url.indexOf(marker);
        if (idx !== -1) {
          const path = decodeURIComponent(l.file_url.substring(idx + marker.length).split('?')[0]);
          const { error: sErr } = await supabaseClient.storage.from(LAW_BUCKET).remove([path]);
          if (sErr && typeof dioLogError === 'function') dioLogError('law file hazf nakaam', sErr);
        }
      }
      _lawList = _lawList.filter(x => x.id !== id);
      try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
      // KHARABI THI: yahan `law-card-<id>` dhoonda jata tha jo kabhi bana hi
      // nahi (satren `law-row-<id>` hain) — is liye hazf karne ke BAAD BHI
      // qanoon fehrist mein nazar aata rehta tha, jab tak safha dobara na
      // khulta. Ab poori fehrist nayi shakl mein — numbering bhi theek.
      _lawRender();
      showToast('حذف ہو گیا','info');
    } catch(e) { dioWriteFail('قانون', e, 'حذف نہیں ہوا'); }
  };
  if (typeof confirmDelete === 'function') confirmDelete(l.title||l.name, doDelete);
  else if (confirm('حذف کریں؟')) doDelete();
}

// ── helper ───────────────────────────────────────────────────
function _lawFooterText() {
  let rank='', name='';
  try {
    const o = JSON.parse(localStorage.getItem('officer_profile')||localStorage.getItem('dio_officer_cache')||'{}');
    rank = o.rank || o.designation || '';
    name = o.name || o.full_name || '';
  } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  const who = [rank, name].filter(Boolean).join(' ');
  return who ? `Generated by Digital IO — تفتیشی افسر: ${who}` : 'Generated by Digital IO';
}
function _lawEsc(s) {
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Expose for inline handlers
window.renderLawLibrary = renderLawLibrary;
window._lawFilter = _lawFilter;
window._openAddLaw = _openAddLaw;
window._saveLaw = _saveLaw;
window._viewLaw = _viewLaw;
window._closeLawReader = _closeLawReader;
window._lawOptions = _lawOptions;
window._closeLawOptions = _closeLawOptions;
// Compatibility aliases (prompt uses these names)
window.viewLaw = (id) => _viewLaw(id);
window.downloadLaw = async (urlOrId, name) => {
  // Accept either an id (preferred) or a direct url
  const byId = _lawList.find(x => x.id === urlOrId);
  if (byId) return _downloadLaw(byId.id);
  // Seedha URL diya gaya — yahan bhi blob ka wohi mehfooz rasta
  return _lawDirectDownload(urlOrId, name);
};
// Seedhe URL se mehfooz download (id maujood na ho)
async function _lawDirectDownload(url, name) {
  const fake = { file_url: url, file_display_name: name || '', file_name: String(url||'').split('?')[0] };
  const nm = _lawFileName(fake), ext = _lawExt(fake);
  try {
    const r = await fetch(url, { mode:'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const b = await r.arrayBuffer();
    const u = URL.createObjectURL(new Blob([b], { type: LAW_MIME[ext] || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = u; a.download = nm; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(u); } catch(_) { /* blob pehle hi aazad ho to koi baat nahi */ } }, 60000);
  } catch (_) { if (navigator.onLine) window.open(url, '_blank', 'noopener'); }
}
window._lawSetCat = _lawSetCat;
window._lawClearFilter = _lawClearFilter;
window._lawOpenLink = _lawOpenLink;
window._lawDirectDownload = _lawDirectDownload;
window.searchInsideLaw = (q) => _lawInternalSearch(q);
window.navigateLawMatch = (d) => _lawNavMatch(d);
window._lawInternalSearch = _lawInternalSearch;
window._lawNavMatch = _lawNavMatch;
window._printLawReader = _printLawReader;
window._printAllLaws = _printAllLaws;
window._downloadLaw = _downloadLaw;
window._editLaw = _editLaw;
window._saveEditedLaw = _saveEditedLaw;
window.editLaw = (id) => _editLaw(id);
window._deleteLaw = _deleteLaw;
