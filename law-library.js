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

// ── PAGE RENDER ──────────────────────────────────────────────
async function renderLawLibrary(container) {
  container.innerHTML = `
  <div style="max-width:100%;margin:0;direction:rtl;">
    <!-- Header: search + add -->
    <div style="display:flex;align-items:center;gap:12px;padding:14px 4px;flex-wrap:wrap;margin-bottom:8px;">
      <div style="font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px;">⚖️ قانونی لائبریری</div>
      <input id="law-main-search" type="text" dir="rtl" placeholder="قانون کا نام تلاش کریں..."
        oninput="_lawFilter(this.value)"
        style="flex:1;min-width:180px;padding:10px 16px;border:1px solid var(--border);border-radius:24px;font-size:15px;outline:none;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_openAddLaw()" class="btn btn-primary" style="white-space:nowrap;">+ نیا قانون شامل کریں</button>
      <button onclick="_printAllLaws()" class="btn btn-secondary btn-sm" title="پوری فہرست پرنٹ کریں">🖨️ فہرست</button>
    </div>

    <div id="law-table-wrap" style="overflow-x:auto;margin:0 -20px;">
      <div style="text-align:center;padding:40px;color:var(--text-muted);width:100%;">⏳ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;

  await _loadLaws();
  _renderLawCards(_lawList);
}

// ── LOAD (cache-first) ───────────────────────────────────────
async function _loadLaws() {
  // Show cache immediately
  try {
    const cached = JSON.parse(localStorage.getItem(LAW_CACHE_KEY) || '[]');
    if (cached.length) { _lawList = cached; _renderLawCards(_lawList); }
  } catch(_) {}

  if (!navigator.onLine) return;
  try {
    const oid = await getOfficerId();
    const { data, error } = await supabaseClient.from('law_library')
      .select('*').order('created_at', { ascending:false });
    if (error) throw error;
    _lawList = data || [];
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) {}
  } catch(e) {
    console.warn('Law load failed, using cache:', e.message);
  }
}

// ── TABLE (one law per row) ──────────────────────────────────
function _renderLawCards(list) {
  const wrap = document.getElementById('law-table-wrap');
  if (!wrap) return;

  if (!list || !list.length) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);width:100%;">
        <div style="font-size:64px;margin-bottom:16px;">📚</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">قانونی لائبریری خالی ہے</div>
        <div style="font-size:14px;margin-bottom:24px;">پہلا قانون شامل کرنے کے لیے اوپر والا بٹن دبائیں</div>
        <button onclick="_openAddLaw()" class="btn btn-primary">+ پہلا قانون شامل کریں</button>
      </div>`;
    return;
  }

  const rows = list.map((l, i) => {
    const hasFile = !!l.file_url;
    const hasLink = !!l.online_link;
    const title = _lawEsc(l.title || l.name || '—');
    const cat = _lawCatLabel(l.category);
    return `
    <tr id="law-row-${l.id}" data-law-name="${title}" data-category="${_lawEsc(cat)}" style="border-bottom:1px solid var(--border);">
      <td style="padding:10px 8px;text-align:center;color:var(--text-muted);font-size:13px;">${i+1}</td>
      <td style="padding:10px 8px;text-align:right;font-weight:700;word-break:break-word;">${title}
        ${l.description?`<div style="font-size:11px;color:var(--text-muted);font-weight:400;">${_lawEsc(l.description)}</div>`:''}</td>
      <td style="padding:10px 8px;text-align:right;">
        <span style="background:rgba(56,189,248,0.12);color:var(--accent);padding:3px 10px;border-radius:12px;font-size:12px;white-space:nowrap;">${_lawEsc(cat)}</span>
      </td>
      <td style="padding:10px 8px;text-align:center;">
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">
          ${hasFile?`<button onclick="_viewLaw('${l.id}')" title="پڑھیں" style="padding:5px 9px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">👁️</button>`:''}
          ${hasFile?`<button onclick="_downloadLaw('${l.id}')" title="ڈاؤنلوڈ" style="padding:5px 9px;background:#28a745;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">⬇️</button>`:''}
          ${hasLink?`<button onclick="window.open('${l.online_link}','_blank')" title="آن لائن" style="padding:5px 9px;background:#6f42c1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🔗</button>`:''}
          <button onclick="_editLaw('${l.id}')" title="ترمیم" style="padding:5px 9px;background:#fd7e14;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">✏️</button>
          <button onclick="_deleteLaw('${l.id}')" title="حذف" style="padding:5px 9px;background:#dc3545;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <table style="width:100%;border-collapse:collapse;direction:rtl;background:var(--bg-card);border-radius:10px;overflow:hidden;">
      <thead>
        <tr style="background:var(--bg-secondary);border-bottom:2px solid var(--border);">
          <th style="padding:11px 8px;text-align:center;width:5%;font-size:13px;">#</th>
          <th style="padding:11px 8px;text-align:right;width:42%;font-size:13px;">قانون کا نام</th>
          <th style="padding:11px 8px;text-align:right;width:20%;font-size:13px;">قسم</th>
          <th style="padding:11px 8px;text-align:center;width:33%;font-size:13px;">اقدامات</th>
        </tr>
      </thead>
      <tbody id="law-table-body">${rows}</tbody>
    </table>`;
}

// ── SEARCH FILTER (debounced) ────────────────────────────────
function _lawFilter(val) {
  clearTimeout(_lawSearchTmr);
  _lawSearchTmr = setTimeout(() => {
    const q = (val||'').trim().toLowerCase();
    if (!q) { _renderLawCards(_lawList); return; }
    const filtered = _lawList.filter(l =>
      (l.title||l.name||'').toLowerCase().includes(q) ||
      (l.description||'').toLowerCase().includes(q) ||
      _lawCatLabel(l.category).toLowerCase().includes(q));
    _renderLawCards(filtered);
  }, 300);
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
      <button class="btn btn-primary" id="law-save-btn" onclick="_saveLaw()">💾 محفوظ کریں</button>
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

  if (!name) { showToast('⚠️ قانون کا نام ضروری ہے','error'); return; }
  if (!file && !link) { showToast('⚠️ فائل یا آن لائن لنک میں سے کم از کم ایک ضروری ہے','error'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const oid = await getOfficerId();
    let fileUrl = null, fileName = null, fileType = null, fileDisplay = null;

    if (file) {
      if (prog) prog.textContent = '📤 فائل اپلوڈ ہو رہی ہے...';
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
      fileType = (ext === 'pdf') ? 'pdf' : 'word';
      fileDisplay = file.name;                      // original (Urdu) name — for display
      // Storage key MUST be pure ASCII (no Urdu/Arabic, spaces, commas) — Supabase rejects otherwise
      const rand = Math.random().toString(36).substring(2, 8);
      const safe = `law_${Date.now()}_${rand}.${ext || 'pdf'}`;
      fileName = safe;                              // clean name stored
      const path = `${oid}/${safe}`;
      const { error: upErr } = await supabaseClient.storage.from(LAW_BUCKET).upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from(LAW_BUCKET).getPublicUrl(path);
      fileUrl = urlData?.publicUrl || null;
    }

    if (prog) prog.textContent = '💾 محفوظ ہو رہا ہے...';
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
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) {}
    closeModal();
    showToast('✅ قانون شامل ہو گیا','success');
    _renderLawCards(_lawList);
  } catch(e) {
    showToast('❌ ' + (e.message||'محفوظ نہیں ہو سکا'),'error');
    if (btn) { btn.disabled = false; btn.textContent = '💾 محفوظ کریں'; }
  }
}

// ── VIEW / READ LAW (full-screen reader) ─────────────────────
function _closeLawReader() {
  const ov = document.getElementById('law-reader-overlay');
  if (ov) {
    if (ov._blobUrl) { try { URL.revokeObjectURL(ov._blobUrl); } catch(_) {} }
    ov.remove();
  }
}

function _viewLaw(id, autoPrint) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.file_url) { showToast('❌ فائل دستیاب نہیں','error'); return; }
  const isPdf = (l.file_type === 'pdf') || l.file_url.toLowerCase().includes('.pdf');

  const overlay = document.createElement('div');
  overlay.id = 'law-reader-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,16,25,0.97);display:flex;flex-direction:column;';
  overlay.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-bottom:1px solid #dee2e6;direction:rtl;flex-wrap:wrap;">
      <div style="font-weight:800;font-size:16px;color:#1a3a5c;flex:1;min-width:140px;">${_lawEsc(l.title||l.name)}</div>
      ${!isPdf ? `<input id="law-internal-search" type="text" dir="rtl" placeholder="سیکشن تلاش کریں... (مثلاً 302)" oninput="_lawInternalSearch(this.value)" style="padding:7px 12px;border:1px solid #dee2e6;border-radius:20px;font-size:13px;min-width:160px;font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_lawNavMatch(-1)" title="پچھلا" style="border:1px solid #dee2e6;background:#f1f3f4;border-radius:6px;padding:6px 9px;cursor:pointer;font-size:12px;">▲</button>
      <button onclick="_lawNavMatch(1)" title="اگلا" style="border:1px solid #dee2e6;background:#f1f3f4;border-radius:6px;padding:6px 9px;cursor:pointer;font-size:12px;">▼</button>
      <span id="law-search-count" style="font-size:12px;color:#6c757d;"></span>` : ''}
      <button onclick="_printLawReader()" style="background:#1a73e8;color:#fff;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;">🖨️ پرنٹ</button>
      <button onclick="_closeLawReader()" style="background:#e2e8f0;color:#1a3a5c;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:700;">✕ بند</button>
    </div>
    <!-- Body -->
    <div id="law-reader-body" style="flex:1;overflow:auto;background:#fff;">
      <div style="text-align:center;padding:40px;color:#6c757d;">⏳ کھل رہا ہے...</div>
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
async function _renderPdfLaw(url, body, autoPrint) {
  body.innerHTML = `<div style="text-align:center;padding:40px;color:#6c757d;">⏳ فائل کھل رہی ہے...</div>`;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('fetch failed ' + resp.status);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    // Remember blob URL on overlay so we can revoke it on close
    const ov = document.getElementById('law-reader-overlay');
    if (ov) ov._blobUrl = blobUrl;
    body.innerHTML = `
      <iframe id="law-pdf-viewer" src="${blobUrl}#toolbar=1&navpanes=1&view=FitH"
        style="width:100%;height:100%;border:none;"></iframe>`;
    if (autoPrint) setTimeout(() => {
      const ifr = document.getElementById('law-pdf-viewer');
      try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch(_) { window.open(blobUrl,'_blank'); }
    }, 600);
  } catch(e) {
    // Network/CORS failed — offer direct open + Google viewer fallback
    const gview = 'https://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(url);
    body.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="background:#fff3cd;padding:8px 14px;font-size:12px;color:#664d03;direction:rtl;border-bottom:1px solid #ffc107;">
          فائل لوڈ ہونے میں دقت ہوئی — متبادل طریقے آزمائیں:
          <button onclick="window.open('${url}','_blank')" style="background:#1a73e8;color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;margin-right:6px;">📄 نئے ٹیب میں</button>
        </div>
        <iframe src="${gview}" style="flex:1;border:none;"></iframe>
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
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buf });
    body.innerHTML = `<div id="law-html-content" style="max-width:850px;margin:0 auto;padding:30px 24px;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:16px;line-height:2;color:#111;">${result.value || '<div style="text-align:center;color:#999;">مواد دستیاب نہیں</div>'}</div>`;
    if (autoPrint) setTimeout(_printLawReader, 300);
  } catch(e) {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:#6c757d;">
      <div style="font-size:40px;margin-bottom:12px;">📄</div>
      <div style="margin-bottom:16px;">فائل اس براؤزر میں نہیں کھل سکی</div>
      <button onclick="window.open('${url}','_blank')" style="background:#1a73e8;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;">نئے ٹیب میں کھولیں</button>
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

// Print whatever is open in the reader
function _printLawReader() {
  const pdf = document.getElementById('law-pdf-viewer');
  if (pdf) { window.open(pdf.src.split('#')[0], '_blank'); return; }
  const content = document.getElementById('law-html-content');
  if (!content) { showToast('❌ پرنٹ کے لیے مواد نہیں','error'); return; }
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:right;font-size:14px;line-height:2;color:#111;}
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
  if (!_lawList.length) { showToast('⚠️ کوئی قانون موجود نہیں','error'); return; }
  const rows = _lawList.map((l,i) => `
    <tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #000;padding:6px;">${_lawEsc(l.title||l.name)}</td>
      <td style="border:1px solid #000;padding:6px;">${_lawEsc(l.description||'—')}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${l.file_url?'✓':(l.online_link?'🌐':'—')}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>
      @page{size:A4;margin:15mm 12mm;}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;color:#111;}
      h2{text-align:center;margin-bottom:14px;}
      table{width:100%;border-collapse:collapse;font-size:13px;}
      th{border:1px solid #000;padding:6px;background:#f0f0f0;}
      .law-print-footer{position:fixed;bottom:4mm;left:4mm;font-size:8pt;color:#999;font-style:italic;}
    </style></head><body>
    <h2>⚖️ قانونی لائبریری — Digital IO</h2>
    <table>
      <tr><th style="width:8%;">نمبر</th><th>قانون کا نام</th><th>تفصیل</th><th style="width:12%;">فائل</th></tr>
      ${rows}
    </table>
    <div class="law-print-footer">${_lawFooterText()}</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); w.print(); }
}

// ── DOWNLOAD ─────────────────────────────────────────────────
function _downloadLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l || !l.file_url) { showToast('❌ فائل دستیاب نہیں','error'); return; }
  const a = document.createElement('a');
  a.href = l.file_url; a.download = l.file_display_name || l.file_name || l.title || l.name; a.target = '_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── RENAME (inline) ──────────────────────────────────────────
// ── FULL EDIT MODAL ──────────────────────────────────────────
function _editLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l) return;
  openModal('✏️ قانون میں ترمیم', `
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
      <button class="btn btn-primary" id="law-edit-save-btn" onclick="_saveEditedLaw('${id}')">💾 محفوظ کریں</button>
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

  if (!name) { showToast('⚠️ قانون کا نام ضروری ہے','error'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'محفوظ ہو رہا ہے...'; }

  try {
    const oid = await getOfficerId();
    const upd = { title: name, category, description: desc||null, online_link: link||null, updated_at: new Date().toISOString() };

    if (file) {
      if (prog) prog.textContent = '📤 نئی فائل اپلوڈ ہو رہی ہے...';
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g,'');
      const rand = Math.random().toString(36).substring(2, 8);
      const safe = `law_${Date.now()}_${rand}.${ext || 'pdf'}`;
      const path = `${oid}/${safe}`;
      const { error: upErr } = await supabaseClient.storage.from(LAW_BUCKET).upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from(LAW_BUCKET).getPublicUrl(path);
      upd.file_url = urlData?.publicUrl || null;
      upd.file_name = safe;
      upd.safe_file_name = safe;
      upd.file_display_name = file.name;
      upd.file_type = (ext === 'pdf') ? 'pdf' : 'word';
    }

    const { error } = await supabaseClient.from('law_library').update(upd).eq('id', id);
    if (error) throw error;

    // Update local list
    Object.assign(l, upd);
    try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) {}
    closeModal();
    showToast('✅ ترمیم محفوظ ہو گئی','success');
    _renderLawCards(_lawList);
  } catch(e) {
    showToast('❌ ' + (e.message||'ترمیم ناکام'),'error');
    if (btn) { btn.disabled = false; btn.textContent = '💾 محفوظ کریں'; }
  }
}

function _renameLaw(id) {
  const l = _lawList.find(x => x.id === id);
  const card = document.getElementById('law-card-'+id);
  if (!l || !card) return;
  const nameEl = card.querySelector('.law-card-name');
  if (!nameEl || nameEl.querySelector('input')) return;
  const old = l.title || l.name;
  nameEl.innerHTML = `<input id="law-rename-inp-${id}" value="${_lawEsc(old)}" style="width:100%;font-size:15px;padding:4px;direction:rtl;text-align:center;border:1px solid var(--accent);border-radius:6px;box-sizing:border-box;font-family:'Jameel Noori Nastaleeq',serif;">`;
  const inp = document.getElementById('law-rename-inp-'+id);
  inp.focus(); inp.select();
  const commit = async () => {
    const newName = inp.value.trim() || old;
    nameEl.textContent = newName;
    if (newName !== old) {
      l.title = newName;
      try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) {}
      try { await supabaseClient.from('law_library').update({ title:newName, updated_at:new Date().toISOString() }).eq('id', id); showToast('✅ نام تبدیل ہو گیا','success'); }
      catch(e){ showToast('❌ '+e.message,'error'); }
    }
  };
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();inp.blur();} });
}

// ── DELETE (with confirmation) ───────────────────────────────
function _deleteLaw(id) {
  const l = _lawList.find(x => x.id === id);
  if (!l) return;
  const doDelete = async () => {
    try {
      // Remove file from storage if present
      if (l.file_url) {
        const marker = '/' + LAW_BUCKET + '/';
        const idx = l.file_url.indexOf(marker);
        if (idx !== -1) {
          const path = decodeURIComponent(l.file_url.substring(idx + marker.length).split('?')[0]);
          await supabaseClient.storage.from(LAW_BUCKET).remove([path]);
        }
      }
      await supabaseClient.from('law_library').delete().eq('id', id);
      _lawList = _lawList.filter(x => x.id !== id);
      try { localStorage.setItem(LAW_CACHE_KEY, JSON.stringify(_lawList)); } catch(_) {}
      const card = document.getElementById('law-card-'+id);
      if (card) card.remove();
      if (!_lawList.length) _renderLawCards(_lawList);
      showToast('🗑️ حذف ہو گیا','info');
    } catch(e) { showToast('❌ '+e.message,'error'); }
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
  } catch(_) {}
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
// Compatibility aliases (prompt uses these names)
window.viewLaw = (id) => _viewLaw(id);
window.downloadLaw = (urlOrId, name) => {
  // Accept either an id (preferred) or a direct url
  const byId = _lawList.find(x => x.id === urlOrId);
  if (byId) return _downloadLaw(byId.id);
  const a = document.createElement('a'); a.href = urlOrId; a.download = name||'law-document'; a.target='_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};
window.searchInsideLaw = (q) => _lawInternalSearch(q);
window.navigateLawMatch = (d) => _lawNavMatch(d);
window._lawInternalSearch = _lawInternalSearch;
window._lawNavMatch = _lawNavMatch;
window._printLawReader = _printLawReader;
window._printAllLaws = _printAllLaws;
window._downloadLaw = _downloadLaw;
window._renameLaw = _renameLaw;
window._editLaw = _editLaw;
window._saveEditedLaw = _saveEditedLaw;
window.editLaw = (id) => _editLaw(id);
window._deleteLaw = _deleteLaw;
