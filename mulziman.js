/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ملزمان (ACCUSED / SUSPECTS) MODULE
   Pattern mirrors witnesses.js — list + add/edit modal
   ═══════════════════════════════════════════════════════════ */

let _accusedList   = [];
let _accusedCaseId = null;
let _accusedPhoto  = null;   // base64 of accused photo
let _accusedCnicCopy = null; // base64 of CNIC copy
let _accusedFormType = 'fir'; // 'fir' or 'tahqeeqati'

// Physical description dropdown options
const ACC_RANG   = ['گندمی','گورا','سانولا','کالا','زرد'];
const ACC_CHEHRA = ['گول','لمبا','بیضوی','چوڑا'];
const ACC_JISM   = ['دبلا','موٹا','درمیانہ','مضبوط'];
const ACC_QAD    = ['پستہ','درمیانہ','لمبا','نہایت لمبا'];
const ACC_NISHAN = ['کوئی نہیں','چہرے پر','بازو پر','ہاتھ پر','گردن پر','دیگر'];

let _accusedViewType = 'fir'; // which type this view shows

// ── ENTRY POINT (called from misal-docs when ملزمان button pressed) ──
async function openAccusedCard(caseId, type) {
  _accusedViewType = type || 'fir';
  _accusedFormType = _accusedViewType; // new records default to this view's type
  _accusedCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
                || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadAccused();
  _renderAccusedArea();
}

async function _loadAccused() {
  const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
  // Offline — use cache
  if (!navigator.onLine) {
    try {
      const cached = JSON.parse(localStorage.getItem('dio_accused_' + _accusedCaseId) || '[]');
      _accusedList = cached;
    } catch(_) { _accusedList = []; }
    return;
  }
  try {
    const { data } = await supabaseClient
      .from('case_accused').select('*')
      .eq('case_id', _accusedCaseId)
      .order('created_at', { ascending: true });
    _accusedList = data || [];
    // Cache for offline
    try { localStorage.setItem('dio_accused_' + _accusedCaseId, JSON.stringify(_accusedList)); } catch(_) {}
  } catch(_) {
    try { _accusedList = JSON.parse(localStorage.getItem('dio_accused_' + _accusedCaseId) || '[]'); }
    catch(_2) { _accusedList = []; }
  }
}

// ── LIST VIEW ─────────────────────────────────────────────────
// ── LIST VIEW (two columns: FIR ملزم | تفتیشی ملزمان) ─────────
function _renderAccusedArea() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  const isCross = _accusedViewType === 'cross_version';
  const list = _accusedList.filter(a => (a.accused_type || 'fir') === _accusedViewType);
  const heading = isCross ? 'ملزمان کراس ورژن' : 'ملزمان FIR';
  const color = isCross ? 'var(--amber)' : 'var(--accent)';

  area.innerHTML = `
  <div style="direction:rtl;height:100%;overflow-y:auto;padding:10px;width:100%;box-sizing:border-box;">
    <div style="font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};border-bottom:2px solid ${color};padding-bottom:6px;margin-bottom:12px;text-align:right;width:100%;box-sizing:border-box;">${heading}</div>
    <div id="acc-list" style="width:100%;">${_renderAccCards(list)}</div>
    <div style="display:flex;gap:6px;margin-top:12px;">
      <button class="btn btn-primary btn-sm" onclick="_openAccusedForm(null,'${_accusedViewType}')">➕ ملزم</button>
      ${list.length ? `<button class="btn btn-danger btn-sm" onclick="_deleteLastAcc('${_accusedViewType}')">➖ ہٹائیں</button>` : ''}
    </div>
  </div>`;
}

// Inject responsive CSS once (avoids brace issues in template literals)
function _injectAccusedCSS() {
  if (document.getElementById('accused-resp-css')) return;
  const s = document.createElement('style');
  s.id = 'accused-resp-css';
  s.textContent = '@media (max-width:768px){.accused-two-col{flex-direction:column !important;}.accused-divider{width:100% !important;height:1px !important;margin:10px 0;}}';
  document.head.appendChild(s);
}

// Compact horizontal cards (witness-card style)
function _renderAccCards(list) {
  if (!list.length) {
    return `<div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">
      <div style="font-size:30px;margin-bottom:6px;">👤</div>
      کوئی ملزم نہیں
    </div>`;
  }
  return list.map(a => `
    <div onclick="_openAccusedForm('${a.id}','${a.accused_type||'fir'}')"
         style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;cursor:pointer;display:flex;align-items:center;gap:8px;">
      ${a.photo_url ? `<img src="${a.photo_url}" style="width:38px;height:38px;border-radius:6px;object-fit:cover;flex-shrink:0;">` : '<span style="font-size:22px;flex-shrink:0;">👤</span>'}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escA(a.name)}</div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;gap:8px;flex-wrap:wrap;">
          ${a.cnic?`<span dir="ltr">🪪 ${_escA(a.cnic)}</span>`:''}
          ${a.pesha?`<span>${_escA(a.pesha)}</span>`:''}
          ${a.arrest_date?`<span dir="ltr">📅 ${_fmtDateDMY(a.arrest_date)}</span>`:''}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" style="padding:2px 7px;flex-shrink:0;" onclick="event.stopPropagation();_deleteAccused('${a.id}')">🗑️</button>
    </div>`).join('');
}

// Format YYYY-MM-DD → dd/mm/yy
function _fmtDateDMY(d) {
  if (!d) return '';
  const p = String(d).split('-');
  if (p.length === 3) return p[2].slice(0,2) + '/' + p[1] + '/' + p[0].slice(2);
  return d;
}

// Delete the last-added accused in a column
function _deleteLastAcc(type) {
  const list = _accusedList.filter(a => (a.accused_type||'fir') === type);
  if (!list.length) return;
  const last = list[list.length - 1];
  _deleteAccused(last.id);
}

// ── ADD / EDIT MODAL ──────────────────────────────────────────
function _openAccusedForm(id, type) {
  const a = id ? (_accusedList.find(x => x.id === id) || {}) : {};
  _accusedFormType = type || a.accused_type || 'fir';
  _accusedPhoto = a.photo_url || null;
  _accusedCnicCopy = a.cnic_copy_url || null;

  const dd = (label, opts, val, fid) => `
    <div style="flex:1;min-width:90px;">
      <label style="font-size:11px;color:var(--text-muted);">${label}</label>
      <select class="form-input" id="${fid}" style="font-size:13px;padding:6px;">
        <option value="">—</option>
        ${opts.map(o => `<option ${val===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`;

  const body = `
  <div style="direction:rtl;text-align:right;max-height:70vh;overflow-y:auto;padding:2px;">
    <!-- نام و پتہ -->
    <label class="form-label">نام و پتہ ملزم</label>
    <input class="form-input" id="acc-name" value="${_escA(a.name)}" placeholder="نام، ولدیت، پتہ" style="margin-bottom:10px;">

    <!-- CNIC + Mobile -->
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="flex:1;">
        <label class="form-label">شناختی کارڈ</label>
        <input class="form-input" id="acc-cnic" dir="ltr" maxlength="15" value="${_escA(a.cnic)}" placeholder="00000-0000000-0" oninput="_fmtCnicInput(this)">
      </div>
      <div style="flex:1;">
        <label class="form-label">موبائل</label>
        <input class="form-input" id="acc-mobile" dir="ltr" maxlength="12" value="${_escA(a.mobile)}" placeholder="0000-0000000" oninput="_fmtMobileInput(this)">
      </div>
    </div>

    <!-- Arrest date + Aliha -->
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="flex:1;">
        <label class="form-label">تاریخ گرفتاری</label>
        <input class="form-input" id="acc-arrest" type="date" dir="ltr" value="${_escA(a.arrest_date)}">
      </div>
      <div style="flex:1;">
        <label class="form-label">پیشہ</label>
        <input class="form-input" id="acc-pesha" value="${_escA(a.pesha)}" placeholder="مثلاً: مزدور، ڈرائیور">
      </div>
    </div>

    <!-- Physical description -->
    <label class="form-label">حلیہ</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
      ${dd('رنگ',   ACC_RANG,   a.rang,   'acc-rang')}
      ${dd('چہرہ',  ACC_CHEHRA, a.chehra, 'acc-chehra')}
      ${dd('جسم',   ACC_JISM,   a.jism,   'acc-jism')}
      ${dd('قد',    ACC_QAD,    a.qad,    'acc-qad')}
      <div style="flex:1;min-width:70px;">
        <label style="font-size:11px;color:var(--text-muted);">عمر</label>
        <input class="form-input" id="acc-umar" dir="ltr" value="${_escA(a.umar)}" placeholder="سال" style="font-size:13px;padding:6px;">
      </div>
      ${dd('نشان',  ACC_NISHAN, a.nishan, 'acc-nishan')}
    </div>

    <!-- Photo + CNIC copy uploads -->
    <div style="display:flex;gap:10px;margin-bottom:6px;">
      <div style="flex:1;">
        <input type="file" id="acc-photo-input" accept="image/*" capture="environment" style="display:none;" onchange="_accPhotoSelect(this)">
        <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="document.getElementById('acc-photo-input').click()">📷 تصویر ملزم</button>
        <div id="acc-photo-preview" style="margin-top:6px;text-align:center;">${_accusedPhoto?`<img src="${_accusedPhoto}" style="max-width:80px;border-radius:6px;">`:''}</div>
      </div>
      <div style="flex:1;">
        <input type="file" id="acc-cnic-input" accept="image/*,application/pdf" style="display:none;" onchange="_accCnicSelect(this)">
        <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="document.getElementById('acc-cnic-input').click()">🪪 شناختی کارڈ کاپی</button>
        <div id="acc-cnic-preview" style="margin-top:6px;text-align:center;font-size:11px;color:var(--green);">${_accusedCnicCopy?'✅ منسلک':''}</div>
      </div>
    </div>
  </div>`;

  openModal(id ? '✏️ ملزم میں ترمیم' : '➕ ملزم درج کریں', body, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveAccused('${id||''}')">💾 محفوظ کریں</button>
  `);
}

// ── IMAGE HANDLING (base64 compressed — offline-safe) ─────────
function _accPhotoSelect(input) {
  const f = input.files[0]; if (!f) return;
  _compressImg(f, 600, 0.7, (b64) => {
    _accusedPhoto = b64;
    const p = document.getElementById('acc-photo-preview');
    if (p) p.innerHTML = `<img src="${b64}" style="max-width:80px;border-radius:6px;">`;
  });
}
function _accCnicSelect(input) {
  const f = input.files[0]; if (!f) return;
  if (f.type === 'application/pdf') {
    const r = new FileReader();
    r.onload = e => { _accusedCnicCopy = e.target.result; const p=document.getElementById('acc-cnic-preview'); if(p)p.innerHTML='✅ PDF منسلک'; };
    r.readAsDataURL(f);
  } else {
    _compressImg(f, 1000, 0.7, (b64) => {
      _accusedCnicCopy = b64;
      const p = document.getElementById('acc-cnic-preview');
      if (p) p.innerHTML = '✅ منسلک';
    });
  }
}
function _compressImg(file, maxW, quality, cb) {
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}

// ── CNIC / Mobile auto-format ─────────────────────────────────
function _fmtCnicInput(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 13);
  if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
  if (v.length > 13) v = v.slice(0,13) + '-' + v.slice(13);
  el.value = v;
}
function _fmtMobileInput(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 4) v = v.slice(0,4) + '-' + v.slice(4);
  el.value = v;
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveAccused(id) {
  const name = document.getElementById('acc-name')?.value.trim();
  if (!name) { showToast('⚠️ ملزم کا نام لکھیں', 'error'); return; }
  const rec = {
    case_id: _accusedCaseId,
    name,
    accused_type: _accusedFormType || 'fir',
    cnic: document.getElementById('acc-cnic')?.value.trim() || null,
    mobile: document.getElementById('acc-mobile')?.value.trim() || null,
    arrest_date: document.getElementById('acc-arrest')?.value || null,
    pesha: document.getElementById('acc-pesha')?.value.trim() || null,
    rang: document.getElementById('acc-rang')?.value || null,
    chehra: document.getElementById('acc-chehra')?.value || null,
    jism: document.getElementById('acc-jism')?.value || null,
    qad: document.getElementById('acc-qad')?.value || null,
    umar: document.getElementById('acc-umar')?.value.trim() || null,
    nishan: document.getElementById('acc-nishan')?.value || null,
    photo_url: _accusedPhoto || null,
    cnic_copy_url: _accusedCnicCopy || null,
  };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    let savedRec = null;
    if (id) {
      const { data } = await supabaseClient.from('case_accused').update(rec).eq('id', id).select().single();
      savedRec = data || { ...rec, id };
      // Update local list
      const idx = _accusedList.findIndex(x => x.id === id);
      if (idx >= 0) _accusedList[idx] = savedRec;
    } else {
      const { data, error } = await supabaseClient.from('case_accused').insert(rec).select().single();
      if (error) throw error;
      savedRec = data ? { ...data, accused_type: data.accused_type || rec.accused_type } : { ...rec, id: 'tmp_' + Date.now() };
      _accusedList.push(savedRec);
    }
    // Update offline cache
    try { localStorage.setItem('dio_accused_' + _accusedCaseId, JSON.stringify(_accusedList)); } catch(_) {}
    _accusedPhoto = null; _accusedCnicCopy = null;
    closeModal();
    await _loadAccused();    // reload from DB (gets ALL records, both types)
    _renderAccusedArea();
    showToast('✅ ملزم محفوظ ہو گیا', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteAccused(id) {
  if (!confirm('کیا آپ یہ ملزم حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('case_accused').delete().eq('id', id);
    await _loadAccused();
    _renderAccusedArea();
    showToast('🗑️ حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── HELPERS ───────────────────────────────────────────────────
function _accTh() { return 'padding:8px 10px;text-align:right;font-size:12px;font-weight:700;color:var(--text-secondary);white-space:nowrap;'; }
function _accTd() { return 'padding:8px 10px;text-align:right;'; }
function _escA(s) { return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
