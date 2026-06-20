/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DIGITAL DIARY (روزنامچہ)
   Paperless notes: text + voice + photo, anywhere anytime
   ═══════════════════════════════════════════════════════════ */

registerPage('diary', renderDiary);

const DIARY_TYPES = [
  { v:'meeting',  label:'میٹنگ',     icon:'👥' },
  { v:'visit',    label:'دورہ',       icon:'🚶' },
  { v:'mulaqat',  label:'ملاقات',     icon:'🤝' },
  { v:'order',    label:'حکم',        icon:'📋' },
  { v:'reminder', label:'یاد دہانی',  icon:'⏰' },
  { v:'personal', label:'ذاتی نوٹ',   icon:'📝' },
];

let _diaryList = [];
let _diaryPhoto = null; // base64 of attached photo
let _diaryFilter = '';

async function renderDiary(container) {
  try {
    container.innerHTML = `<div id="diary-root" style="max-width:640px;margin:0 auto;"></div>`;
    await _loadDiary();
    _drawDiary();
  } catch(err) {
    console.error('Diary render error:', err);
    container.innerHTML = `<div style="padding:30px;text-align:center;direction:rtl;"><div style="font-size:40px;">⚠️</div><div style="margin-top:10px;">ڈائری کھولنے میں مسئلہ</div><div style="font-size:11px;color:var(--text-muted);direction:ltr;font-family:monospace;margin-top:8px;">${(err&&err.message)||err}</div></div>`;
  }
}

async function _loadDiary() {
  try {
    const oid = await getOfficerId();
    if (!oid) { _diaryList = []; return; }
    const { data } = await supabaseClient.from('diary_entries')
      .select('*').eq('officer_id', oid)
      .order('created_at', { ascending: false });
    _diaryList = data || [];
  } catch(_) { _diaryList = []; }
}

function _drawDiary() {
  const root = document.getElementById('diary-root');
  if (!root) return;

  const filtered = _diaryFilter
    ? _diaryList.filter(d => (d.content||'').toLowerCase().includes(_diaryFilter.toLowerCase()) ||
                             (d.entry_type||'').includes(_diaryFilter))
    : _diaryList;

  const o = currentOfficer || {};
  const now = new Date();
  const lockTime = now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) + ' ' + now.toLocaleDateString('en-GB');

  root.innerHTML = `
  <!-- Row 1: Title -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;">
    <button onclick="showPage('dashboard',null)" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:20px;cursor:pointer;color:var(--accent);">←</button>
    <div style="flex:1;text-align:center;">
      <div style="font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;">ڈیجیٹل ڈائری <span style="font-size:14px;color:var(--text-muted);font-style:italic;">(Digital Diary)</span></div>
    </div>
    <div style="width:60px;"></div>
  </div>

  <!-- Row 2: Meeting Log Section (2 columns) -->
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;direction:rtl;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <label class="form-label">میٹنگ کا مقصد:</label>
        <input class="form-input" id="diary-purpose" placeholder="مثلاً: صوبائی کرائم ریویو میٹنگ" style="font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
      <div>
        <label class="form-label">افسر کا عہدہ:</label>
        <input class="form-input" id="diary-rank" placeholder="مثلاً: DPO" style="font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
    </div>
  </div>

  <!-- Row 3: Handwriting / main note canvas -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;direction:rtl;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;">📝 نوٹ اسکرین (Notes Canvas)</div>
    <textarea class="form-input" id="diary-content" rows="5" placeholder="یہاں احکامات یا تفصیل لکھیں... مثلاً: مقدمہ نمبر 45/24 میں ریکوری تیز کریں۔ ضمنی نمبر 3 فوری مکمل کریں۔"
      style="font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:2;resize:vertical;min-height:110px;"></textarea>
  </div>

  <!-- Row 4: Voice & Keyboard Input -->
  <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;direction:rtl;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;">🎙️ وائس ٹائپنگ اور کی بورڈ ان پٹ</div>
    <div style="display:flex;gap:8px;align-items:stretch;">
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <input class="form-input" id="diary-quick" placeholder="وائس کمانڈ یا فوری نوٹ یہاں لکھیں..." style="font-family:'Jameel Noori Nastaleeq',serif;">
        <button class="btn btn-primary btn-sm" onclick="_diaryAppendQuick()" style="align-self:flex-start;">📨 بھیجیں</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button onclick="_diaryVoice()" id="diary-mic" style="width:42px;height:42px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);font-size:18px;cursor:pointer;" title="وائس کمانڈ">🎙️</button>
        <button onclick="document.getElementById('diary-quick').focus()" style="width:42px;height:42px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);font-size:18px;cursor:pointer;" title="کی بورڈ">⌨️</button>
      </div>
    </div>
  </div>

  <!-- Photo + location + type + save -->
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;direction:rtl;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      ${DIARY_TYPES.map((t,i) => `
        <label style="display:flex;align-items:center;gap:4px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:16px;padding:4px 10px;font-size:12px;cursor:pointer;">
          <input type="radio" name="diary-type" value="${t.v}" ${i===0?'checked':''} style="accent-color:var(--accent);">${t.icon} ${t.label}
        </label>`).join('')}
    </div>
    <input type="file" id="diary-photo-input" accept="image/*" capture="environment" style="display:none;" onchange="_diaryPhotoSelect(this)">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('diary-photo-input').click()">📷 تصویر</button>
      <button class="btn btn-secondary btn-sm" onclick="_diaryGetLocation()">📍 مقام</button>
      <span id="diary-loc-status" style="font-size:11px;color:var(--text-muted);"></span>
    </div>
    <div id="diary-photo-preview" style="margin-top:8px;"></div>
  </div>

  <!-- Row 5: Bottom features -->
  <div style="margin-bottom:14px;direction:rtl;">
    <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-align:right;">محفوظ فائلیں اور فیچرز</div>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <button class="btn btn-primary" onclick="_saveDiary('')" style="flex:1;">💾 محفوظ کریں</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      <button class="btn btn-secondary" onclick="_diaryPDF()" style="font-size:11px;">📄 PDF رپورٹ</button>
      <button class="btn btn-secondary" onclick="document.getElementById('diary-search-box').scrollIntoView({behavior:'smooth'});document.querySelector('#diary-search-box input')?.focus()" style="font-size:11px;">🔍 مقدمہ سے تلاش</button>
      <button class="btn btn-secondary" onclick="showToast('🔒 آٹو ٹائم لاک: ${lockTime}','info',3000)" style="font-size:11px;">🔒 ${lockTime}</button>
    </div>
  </div>

  <!-- Search + Saved entries -->
  <div id="diary-search-box" style="direction:rtl;">
    ${_diaryList.length ? `
    <input class="form-input" placeholder="🔍 محفوظ ڈائری میں تلاش..." value="${_diaryFilter}"
      oninput="_diaryFilter=this.value;_drawDiary()" style="font-size:13px;margin-bottom:12px;">` : ''}
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">محفوظ اندراجات: ${_diaryList.length}</div>
    ${_renderDiaryEntries(filtered)}
  </div>`;
}

// Append quick input to main canvas
function _diaryAppendQuick() {
  const q = document.getElementById('diary-quick');
  const main = document.getElementById('diary-content');
  if (q && main && q.value.trim()) {
    main.value += (main.value ? '\n' : '') + q.value.trim();
    q.value = '';
    showToast('✅ نوٹ میں شامل', 'success', 1200);
  }
}

function _renderDiaryEntries(entries) {
  if (!entries.length) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:44px;margin-bottom:10px;">📓</div>
      <div style="font-size:14px;">${_diaryFilter ? 'کوئی نتیجہ نہیں ملا' : 'ابھی کوئی اندراج نہیں'}</div>
      <div style="font-size:11px;margin-top:6px;">میٹنگ، دورہ، ملاقات — سب یہاں محفوظ کریں</div>
    </div>`;
  }
  return entries.map(d => {
    const t = DIARY_TYPES.find(x => x.v === d.entry_type) || { icon:'📝', label:d.entry_type||'نوٹ' };
    const dt = new Date(d.created_at);
    const dateStr = dt.toLocaleDateString('ur-PK') + ' · ' + dt.toLocaleTimeString('ur-PK', {hour:'2-digit',minute:'2-digit'});
    return `
    <div class="card" style="padding:14px;margin-bottom:10px;border-right:3px solid var(--accent);direction:rtl;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">${t.icon}</span>
          <span style="font-size:13px;font-weight:700;color:var(--accent);">${t.label}</span>
        </div>
        <div style="display:flex;gap:5px;">
          <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openDiaryForm('${d.id}')">✏️</button>
          <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_shareDiary('${d.id}')">📤</button>
          <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteDiary('${d.id}')">🗑️</button>
        </div>
      </div>
      <div style="font-size:14px;line-height:1.9;white-space:pre-wrap;font-family:'Jameel Noori Nastaleeq',serif;">${_escD(d.content)}</div>
      ${d.photo_url ? `<img src="${d.photo_url}" style="max-width:100%;border-radius:8px;margin-top:10px;">` : ''}
      ${d.location ? `<div style="font-size:11px;color:var(--text-muted);margin-top:8px;">📍 ${d.location}</div>` : ''}
      <div style="font-size:10px;color:var(--text-faint);margin-top:8px;">${dateStr}</div>
    </div>`;
  }).join('');
}

function _openDiaryForm(id) {
  const d = id ? (_diaryList.find(x => x.id === id) || {}) : {};
  _diaryPhoto = d.photo_url || null;
  const box = document.getElementById('diary-form-box');
  if (!box) return;
  box.innerHTML = `
  <div class="card" style="padding:14px;margin-bottom:14px;border:1px solid var(--accent);direction:rtl;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      ${DIARY_TYPES.map(t => `
        <label style="display:flex;align-items:center;gap:4px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:16px;padding:4px 10px;font-size:12px;cursor:pointer;">
          <input type="radio" name="diary-type" value="${t.v}" ${(d.entry_type||'meeting')===t.v?'checked':''} style="accent-color:var(--accent);">
          ${t.icon} ${t.label}
        </label>`).join('')}
    </div>
    <div style="display:flex;gap:6px;align-items:flex-start;">
      <textarea class="form-input" id="diary-content" rows="4" placeholder="یہاں لکھیں... (یا 🎙️ سے بولیں)"
        style="font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:1.9;resize:vertical;">${_escD(d.content)}</textarea>
      <button onclick="_diaryVoice()" id="diary-mic" style="width:40px;height:40px;border:1px solid var(--border);border-radius:8px;background:var(--bg-secondary);font-size:18px;cursor:pointer;flex-shrink:0;">🎙️</button>
    </div>
    <!-- Photo -->
    <div style="margin-top:10px;">
      <input type="file" id="diary-photo-input" accept="image/*" capture="environment" style="display:none;" onchange="_diaryPhotoSelect(this)">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('diary-photo-input').click()">📷 تصویر لگائیں</button>
        <button class="btn btn-secondary btn-sm" onclick="_diaryGetLocation()">📍 مقام</button>
        <span id="diary-loc-status" style="font-size:11px;color:var(--text-muted);"></span>
      </div>
      <div id="diary-photo-preview" style="margin-top:8px;">${_diaryPhoto?`<img src="${_diaryPhoto}" style="max-width:120px;border-radius:8px;">`:''}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn btn-primary" onclick="_saveDiary('${id||''}')">💾 محفوظ کریں</button>
      <button class="btn btn-secondary" onclick="document.getElementById('diary-form-box').innerHTML='';_diaryPhoto=null;">منسوخ</button>
    </div>
  </div>`;
  box.scrollIntoView({ behavior:'smooth', block:'start' });
}

// Voice typing
let _diaryRecog = null;
function _diaryVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('⚠️ آپ کا براؤزر وائس ٹائپنگ سپورٹ نہیں کرتا', 'warn'); return; }
  const mic = document.getElementById('diary-mic');
  const ta = document.getElementById('diary-content');
  if (_diaryRecog) { _diaryRecog.stop(); _diaryRecog = null; if(mic)mic.style.background='var(--bg-secondary)'; return; }
  _diaryRecog = new SR();
  _diaryRecog.lang = 'ur-PK';
  _diaryRecog.continuous = true;
  _diaryRecog.interimResults = false;
  if (mic) mic.style.background = 'var(--red)';
  _diaryRecog.onresult = (e) => {
    let txt = '';
    for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
    if (ta) ta.value += (ta.value ? ' ' : '') + txt;
  };
  _diaryRecog.onend = () => { if(mic)mic.style.background='var(--bg-secondary)'; _diaryRecog=null; };
  _diaryRecog.start();
  showToast('🎙️ بولیں... (دوبارہ دبا کر بند کریں)', 'info');
}

// Photo: read as base64 (compressed)
function _diaryPhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    // Compress via canvas to keep size small
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 1000;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      _diaryPhoto = canvas.toDataURL('image/jpeg', 0.7);
      const prev = document.getElementById('diary-photo-preview');
      if (prev) prev.innerHTML = `<img src="${_diaryPhoto}" style="max-width:120px;border-radius:8px;">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function _diaryGetLocation() {
  const status = document.getElementById('diary-loc-status');
  if (!navigator.geolocation) { if(status)status.textContent='⚠️ GPS دستیاب نہیں'; return; }
  if (status) status.textContent = '⏳ مقام لیا جا رہا ہے...';
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    window._diaryLoc = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    if (status) status.textContent = '✅ ' + window._diaryLoc;
    // Try to get place name
    if (navigator.onLine) {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const j = await r.json();
        if (j.display_name) { window._diaryLoc = j.display_name.split(',').slice(0,3).join(','); if(status)status.textContent='✅ '+window._diaryLoc; }
      } catch(_) {}
    }
  }, () => { if(status)status.textContent='⚠️ مقام نہیں مل سکا'; }, { timeout:10000 });
}

async function _saveDiary(id) {
  const content = document.getElementById('diary-content')?.value.trim();
  const purpose = document.getElementById('diary-purpose')?.value.trim() || '';
  const rank = document.getElementById('diary-rank')?.value.trim() || '';
  const type = document.querySelector('input[name="diary-type"]:checked')?.value || 'personal';
  // Combine purpose/rank into content header if present
  let fullContent = content || '';
  if (purpose || rank) {
    const head = [purpose && `میٹنگ کا مقصد: ${purpose}`, rank && `عہدہ: ${rank}`].filter(Boolean).join(' · ');
    fullContent = head + (fullContent ? '\n\n' + fullContent : '');
  }
  if (!fullContent && !_diaryPhoto) { showToast('⚠️ کچھ لکھیں یا تصویر لگائیں', 'error'); return; }
  try {
    const oid = await getOfficerId();
    const rec = {
      entry_type: type,
      content: fullContent,
      photo_url: _diaryPhoto || null,
      location: window._diaryLoc || null,
    };
    if (id) {
      await supabaseClient.from('diary_entries').update(rec).eq('id', id);
    } else {
      await supabaseClient.from('diary_entries').insert({ ...rec, officer_id: oid });
    }
    window._diaryLoc = null;
    _diaryPhoto = null;
    await _loadDiary();
    _drawDiary();
    showToast('✅ اندراج محفوظ ہو گیا', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteDiary(id) {
  if (!confirm('کیا آپ یہ اندراج حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('diary_entries').delete().eq('id', id);
    await _loadDiary();
    _drawDiary();
    showToast('🗑️ حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

function _shareDiary(id) {
  const d = _diaryList.find(x => x.id === id);
  if (!d) return;
  const t = DIARY_TYPES.find(x => x.v === d.entry_type) || { label:'نوٹ' };
  const dt = new Date(d.created_at).toLocaleString('ur-PK');
  const txt = `📓 ${t.label}\n${dt}\n\n${d.content}${d.location?`\n\n📍 ${d.location}`:''}\n\nDigital IO`;
  if (navigator.share) { navigator.share({ title:'روزنامچہ', text:txt }).catch(()=>{}); }
  else { navigator.clipboard.writeText(txt).then(()=>showToast('📋 کاپی ہو گیا','success')); }
}

// Generate a printable PDF report of all diary entries
function _diaryPDF() {
  const o = currentOfficer || {};
  if (!_diaryList.length) { showToast('⚠️ کوئی اندراج نہیں', 'warn'); return; }
  const rows = _diaryList.map((d,i) => {
    const t = DIARY_TYPES.find(x => x.v === d.entry_type) || { label:'نوٹ' };
    const dt = new Date(d.created_at).toLocaleString('ur-PK');
    return `<tr>
      <td style="border:1px solid #999;padding:6px;text-align:center;">${i+1}</td>
      <td style="border:1px solid #999;padding:6px;">${t.label}</td>
      <td style="border:1px solid #999;padding:6px;white-space:pre-wrap;">${_escD(d.content)}</td>
      <td style="border:1px solid #999;padding:6px;font-size:11px;white-space:nowrap;">${dt}</td>
    </tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{margin:15mm}body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;}
    table{width:100%;border-collapse:collapse;font-size:13px;}th{background:#1a3a5c;color:#fff;padding:8px;border:1px solid #999;}</style></head><body>
    <h2 style="text-align:center;">ڈیجیٹل ڈائری رپورٹ</h2>
    <div style="text-align:center;font-size:13px;margin-bottom:12px;">${o.designation||''} ${o.full_name||''} — تھانہ ${o.station||''}</div>
    <table><thead><tr><th>نمبر</th><th>قسم</th><th>تفصیل</th><th>تاریخ و وقت</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="text-align:left;margin-top:20px;font-size:10px;color:#999;">Created by DIGITAL IO</div>
    </body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  showToast('📄 رپورٹ تیار — پرنٹ یا PDF کے طور پر محفوظ کریں', 'success', 4000);
}

function _escD(s) {
  return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
