/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — قانونی لائبریری (Law Library)  law-library.js
   Upload / read / search / print full law documents (PPC, CrPC...)
   ═══════════════════════════════════════════════════════════════ */

registerPage('law', renderLawLibrary);

const LAW_BUCKET = 'law-library';
const LAW_CACHE_KEY = 'cache_law_library';
let _lawList = [];
let _lawSearchTmr = null;

// ── PAGE RENDER ──────────────────────────────────────────────
async function renderLawLibrary(container) {
  container.innerHTML = `
  <div style="max-width:1100px;margin:0 auto;direction:rtl;">
    <!-- Header: search + add -->
    <div style="display:flex;align-items:center;gap:12px;padding:14px 4px;flex-wrap:wrap;margin-bottom:8px;">
      <div style="font-size:20px;font-weight:800;display:flex;align-items:center;gap:8px;">⚖️ قانونی لائبریری</div>
      <input id="law-main-search" type="text" dir="rtl" placeholder="قانون کا نام تلاش کریں..."
        oninput="_lawFilter(this.value)"
        style="flex:1;min-width:180px;padding:10px 16px;border:1px solid var(--border);border-radius:24px;font-size:15px;outline:none;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">
      <button onclick="_openAddLaw()" class="btn btn-primary" style="white-space:nowrap;">+ نیا قانون شامل کریں</button>
      <button onclick="_printAllLaws()" class="btn btn-secondary btn-sm" title="پوری فہرست پرنٹ کریں">🖨️ فہرست</button>
    </div>

    <div id="law-cards-grid" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-start;">
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

// ── CARDS GRID ───────────────────────────────────────────────
function _renderLawCards(list) {
  const grid = document.getElementById('law-cards-grid');
  if (!grid) return;

  if (!list || !list.length) {
    grid.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);width:100%;">
        <div style="font-size:64px;margin-bottom:16px;">📚</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:8px;">قانونی لائبریری خالی ہے</div>
        <div style="font-size:14px;margin-bottom:24px;">پہلا قانون شامل کرنے کے لیے اوپر والا بٹن دبائیں</div>
        <button onclick="_openAddLaw()" class="btn btn-primary">+ پہلا قانون شامل کریں</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(l => {
    const isPdf = (l.file_type === 'pdf') || (l.file_url && l.file_url.toLowerCase().includes('.pdf'));
    const icon = isPdf ? '📕' : (l.file_url ? '📘' : '📄');
    const hasLink = !!l.online_link;
    return `
    <div class="law-card" id="law-card-${l.id}" style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);padding:16px;width:280px;box-sizing:border-box;direction:rtl;">
      <div style="font-size:46px;text-align:center;margin-bottom:10px;">${icon}</div>
      <div class="law-card-name" style="font-weight:800;font-size:16px;margin-bottom:6px;text-align:center;word-break:break-word;">${_lawEsc(l.title||l.name)}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;text-align:center;min-height:18px;">${_lawEsc(l.description||'')}</div>
      <div style="font-size:10px;color:var(--text-faint);margin-bottom:10px;text-align:center;word-break:break-word;">${l.file_display_name?_lawEsc(l.file_display_name):''}${l.created_at?` · ${formatDate(l.created_at)}`:''}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
        ${l.file_url ? `<button class="btn btn-secondary btn-sm" onclick="_viewLaw('${l.id}')">👁️ پڑھیں</button>` : ''}
        ${l.file_url ? `<button class="btn btn-secondary btn-sm" onclick="_downloadLaw('${l.id}')">⬇️ ڈاؤنلوڈ</button>` : ''}
        ${l.file_url ? `<button class="btn btn-secondary btn-sm" onclick="_viewLaw('${l.id}',true)">🖨️ پرنٹ</button>` : ''}
        ${hasLink ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${l.online_link}','_blank')">🌐 آن لائن</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="_renameLaw('${l.id}')">✏️ نام بدلیں</button>
        <button class="btn btn-danger btn-sm" onclick="_deleteLaw('${l.id}')">🗑️ حذف</button>
      </div>
    </div>`;
  }).join('');
}

// ── SEARCH FILTER (debounced) ────────────────────────────────
function _lawFilter(val) {
  clearTimeout(_lawSearchTmr);
  _lawSearchTmr = setTimeout(() => {
    const q = (val||'').trim().toLowerCase();
    if (!q) { _renderLawCards(_lawList); return; }
    const filtered = _lawList.filter(l =>
      (l.title||l.name||'').toLowerCase().includes(q) ||
      (l.description||'').toLowerCase().includes(q));
    _renderLawCards(filtered);
  }, 300);
}

// ── ADD NEW LAW MODAL ────────────────────────────────────────
function _openAddLaw() {
  openModal('+ نیا قانون شامل کریں', `
    <div style="direction:rtl;">
      <label class="form-label">قانون کا نام *</label>
      <input class="form-input" id="law-f-name" placeholder="مثلاً: تعزیرات پاکستان (PPC)" dir="rtl" style="margin-bottom:10px;">
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
    const rec = { officer_id: oid, title: name, category: 'قانون', description: desc||null, file_url: fileUrl, file_name: fileName, file_display_name: fileDisplay, safe_file_name: fileName, file_type: fileType, is_public: true, online_link: link||null };
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
      <button onclick="document.getElementById('law-reader-overlay').remove()" style="background:#e2e8f0;color:#1a3a5c;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:700;">✕ بند</button>
    </div>
    <!-- Body -->
    <div id="law-reader-body" style="flex:1;overflow:auto;background:#fff;">
      <div style="text-align:center;padding:40px;color:#6c757d;">⏳ کھل رہا ہے...</div>
    </div>`;
  document.body.appendChild(overlay);

  const body = document.getElementById('law-reader-body');
  if (isPdf) {
    body.innerHTML = `<iframe id="law-pdf-viewer" src="${l.file_url}#toolbar=1&navpanes=1" style="width:100%;height:100%;border:none;"></iframe>`;
    if (autoPrint) setTimeout(() => window.open(l.file_url, '_blank'), 300);
  } else {
    // Word file → render via mammoth (loaded on demand)
    _renderWordLaw(l.file_url, body, autoPrint);
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
window._lawInternalSearch = _lawInternalSearch;
window._lawNavMatch = _lawNavMatch;
window._printLawReader = _printLawReader;
window._printAllLaws = _printAllLaws;
window._downloadLaw = _downloadLaw;
window._renameLaw = _renameLaw;
window._deleteLaw = _deleteLaw;
