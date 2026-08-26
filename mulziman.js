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
const ACC_CHEHRA = ['گول','لمبا','لمبوترہ','بیضوی','چوڑا'];
const ACC_JISM   = ['پتلا پھرتیلا','کمزور','پتلاکمزور جسم','درمیانہ','مضبوط','بھاری مضبوط'];

// قد: 4'-5" سے 7'-0" تک (ہر انچ)
const ACC_QAD = (function(){
  const o = [];
  for (let inch = 53; inch <= 84; inch++) {   // 53 = 4'5", 84 = 7'0"
    o.push(Math.floor(inch/12) + "'-" + (inch%12) + '"');
  }
  return o;
})();

// عمر: 15/16 سال سے 35/36 سال تک (+ اپنی مرضی سے اضافہ ممکن)
const ACC_UMAR = (function(){
  const o = [];
  for (let y = 15; y <= 35; y++) o.push(y + '/' + (y+1) + ' سال');
  return o;
})();

// نشان: (+ اپنی مرضی سے اضافہ ممکن)
const ACC_NISHAN = [
  'گردن پر تل',
  'رخسار پر تل',
  'دائیں ہاتھ پر نشان زخم صحت شدہ',
  'بائیں ہاتھ پر نشان زخم صحت شدہ',
  'بائیں ہاتھ کی پشت پر نشان زخم صحت شدہ',
  'دائیں ہاتھ کی پشت پر نشان زخم صحت شدہ',
  'دائیں بازو پر نشان زخم صحت شدہ',
  'بائیں بازو پر نشان زخم صحت شدہ'
];

// تعلیم
const ACC_TALEEM = ['پرائمری','مڈل','میٹرک','FSc','FA','BA','BSc','MA','MSc','حافظ قرآن'];

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

// ── FORM CSS (injected once) ──────────────────────────────────
function _accInjectCSS() {
  if (document.getElementById('acc-form-css')) return;
  const s = document.createElement('style');
  s.id = 'acc-form-css';
  s.textContent = `
  .acc-form{direction:rtl;text-align:right;}
  .acc-form .acc-label{
    font-size:14pt;font-weight:700;text-align:right;white-space:nowrap;
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
    margin:0;color:var(--text,#111);line-height:1.4;flex:0 0 auto;
  }
  .acc-form .acc-section{
    display:block;font-size:14pt;font-weight:800;text-align:right;
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
    margin:10px 0 5px;color:var(--text,#111);
    border-bottom:1px dashed var(--border);padding-bottom:2px;
  }
  .acc-form .acc-field{display:flex;flex-direction:row;align-items:center;gap:6px;}
  .acc-form .acc-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;align-items:center;}
  .acc-form .acc-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px 10px;align-items:center;}
  .acc-form .acc-grid5{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:7px 8px;align-items:center;}
  .acc-form .form-input{flex:1;min-width:0;width:auto;box-sizing:border-box;font-size:14pt;padding:5px 6px;}
  .acc-form select.form-input,.acc-form input.form-input{text-align:center;}
  @media(max-width:640px){.acc-form .acc-grid5{grid-template-columns:1fr 1fr 1fr;}}
  @media(max-width:560px){.acc-form .acc-grid3{grid-template-columns:1fr 1fr;}}
  `;
  document.head.appendChild(s);
}

// ── LIST VIEW ─────────────────────────────────────────────────
// ── LIST VIEW (two columns: FIR ملزم | تفتیشی ملزمان) ─────────
function _renderAccusedArea() {
  _accInjectCSS();
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
    <div style="display:flex;align-items:center;gap:8px;border-bottom:2px solid ${color};padding-bottom:6px;margin-bottom:12px;width:100%;box-sizing:border-box;">
      <button class="btn btn-primary btn-sm" style="flex:0 0 auto;" onclick="_openAccusedForm(null,'${_accusedViewType}')">➕ ملزم</button>
      ${list.length ? `<button class="btn btn-danger btn-sm" style="flex:0 0 auto;" onclick="_deleteLastAcc('${_accusedViewType}')">➖</button>` : ''}
      <div style="flex:1;font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};text-align:center;">${heading}</div>
    </div>
    <div id="acc-list" style="width:100%;">${_renderAccCards(list)}</div>
  </div>`;
}

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
          ${a.taleem?`<span>🎓 ${_escA(a.taleem)}</span>`:''}
          ${a.umar?`<span>${_escA(a.umar)}</span>`:''}
          ${a.arrest_date?`<span dir="ltr">📅 ${_fmtDateDMY(a.arrest_date)}</span>`:''}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" style="padding:2px 7px;flex-shrink:0;" onclick="event.stopPropagation();_deleteAccused('${a.id}')">🗑️</button>
    </div>`).join('');
}

// Format YYYY-MM-DD → dd/mm/yyyy
function _fmtDateDMY(d) {
  if (!d) return '';
  const p = String(d).split('-');
  if (p.length === 3) return p[2].slice(0,2) + '/' + p[1] + '/' + p[0];
  return d;
}

// Delete the last-added accused in a column
function _deleteLastAcc(type) {
  const list = _accusedList.filter(a => (a.accused_type||'fir') === type);
  if (!list.length) return;
  const last = list[list.length - 1];
  _deleteAccused(last.id);
}

// ── CUSTOM-OPTION STORAGE (for عمر / نشان "+" additions) ───────
function _accCustomOpts(key) {
  try { return JSON.parse(localStorage.getItem('dio_acc_opts_' + key) || '[]'); }
  catch(_) { return []; }
}
function _accSaveCustomOpt(key, val) {
  const l = _accCustomOpts(key);
  if (!l.includes(val)) { l.push(val); try { localStorage.setItem('dio_acc_opts_' + key, JSON.stringify(l)); } catch(_) {} }
}
function _accDdAdd(el, key) {
  if (el.value !== '__add__') return;
  const v = (prompt('نیا آپشن لکھیں:') || '').trim();
  if (!v) { el.value = ''; return; }
  _accSaveCustomOpt(key, v);
  const addOpt = el.querySelector('option[value="__add__"]');
  const opt = document.createElement('option');
  opt.value = v; opt.textContent = v;
  el.insertBefore(opt, addOpt);
  el.value = v;
}
// Select with default options + saved-custom options + "➕" add row
function _accCustomSelect(opts, val, fid, key, dir) {
  const custom = _accCustomOpts(key);
  const all = opts.slice();
  custom.forEach(c => { if (!all.includes(c)) all.push(c); });
  if (val && !all.includes(val)) all.unshift(val);
  return `<select class="form-input" id="${fid}" ${dir?`dir="${dir}"`:''} onchange="_accDdAdd(this,'${key}')">
    <option value="">—</option>
    ${all.map(o => `<option value="${_escA(o)}" ${val===o?'selected':''}>${_escA(o)}</option>`).join('')}
    <option value="__add__">➕ اپنی مرضی سے لکھیں</option>
  </select>`;
}

// ── KEYBOARD BEHAVIOUR (MS Word / Excel style) ────────────────
//  • Tab / Shift+Tab  → next / previous field  (native)
//  • Up / Down        → work INSIDE the field only
//                        - dropdown: change the selected option (native)
//                        - text/date: native (no field jump)
//  • Left / Right     → move the text cursor; on a dropdown they do
//                        NOTHING (they must not change the option)
//  • Space            → open the focused dropdown
function _accKeyNav(e) {
  const form = document.querySelector('.acc-form');
  if (!form || !form.contains(e.target)) return;
  const t = e.target;
  const k = e.key;

  // On a dropdown, Left/Right must not change the option (up/down's job)
  if (t.tagName === 'SELECT' && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Left' || k === 'Right')) {
    e.preventDefault();
    return;
  }

  // Space opens the focused dropdown
  if ((k === ' ' || k === 'Spacebar' || k === 'Space') && t.tagName === 'SELECT') {
    if (typeof t.showPicker === 'function') { e.preventDefault(); try { t.showPicker(); } catch(_) {} }
  }
  // Tab, Up/Down and cursor keys in text = native (stay within the field)
}

// ── ADD / EDIT MODAL ──────────────────────────────────────────
function _openAccusedForm(id, type) {
  _accInjectCSS();
  const a = id ? (_accusedList.find(x => x.id === id) || {}) : {};
  _accusedFormType = type || a.accused_type || 'fir';
  _accusedPhoto = a.photo_url || null;
  _accusedCnicCopy = a.cnic_copy_url || null;

  // plain dropdown (label + select) inside a grid cell
  const dd = (label, opts, val, fid, dir) => `
    <div class="acc-field">
      <label class="acc-label">${label}</label>
      <select class="form-input" id="${fid}" ${dir?`dir="${dir}"`:''}>
        <option value="">—</option>
        ${opts.map(o => `<option value="${_escA(o)}" ${val===o?'selected':''}>${_escA(o)}</option>`).join('')}
      </select>
    </div>`;

  const body = `
  <div class="acc-form" style="max-height:74vh;overflow-y:auto;padding:2px 4px;">

    <!-- نام و پتہ -->
    <div class="acc-field" style="margin-bottom:6px;">
      <label class="acc-label">نام و پتہ ملزم</label>
      <input class="form-input" id="acc-name" value="${_escA(a.name)}" placeholder="نام، ولدیت، پتہ" style="text-align:right;">
    </div>

    <!-- شناختی کارڈ | موبائل | پیشہ (ایک لائن) -->
    <div class="acc-grid3">
      <div class="acc-field">
        <label class="acc-label">شناختی کارڈ</label>
        <input class="form-input" id="acc-cnic" dir="ltr" maxlength="15" value="${_escA(a.cnic)}" placeholder="00000-0000000-0" oninput="_fmtCnicInput(this)">
      </div>
      <div class="acc-field">
        <label class="acc-label">موبائل</label>
        <input class="form-input" id="acc-mobile" dir="ltr" maxlength="12" value="${_escA(a.mobile)}" placeholder="0000-0000000" oninput="_fmtMobileInput(this)">
      </div>
      <div class="acc-field">
        <label class="acc-label">پیشہ</label>
        <input class="form-input" id="acc-pesha" value="${_escA(a.pesha)}" placeholder="مثلاً: مزدور، ڈرائیور">
      </div>
    </div>

    <!-- تعلیم | عمر | تاریخ گرفتاری (ایک لائن) -->
    <div class="acc-grid3">
      <div class="acc-field">
        <label class="acc-label">تعلیم</label>
        <select class="form-input" id="acc-taleem">
          <option value="">—</option>
          ${ACC_TALEEM.map(o => `<option value="${_escA(o)}" ${a.taleem===o?'selected':''}>${_escA(o)}</option>`).join('')}
        </select>
      </div>
      <div class="acc-field">
        <label class="acc-label">عمر</label>
        ${_accCustomSelect(ACC_UMAR, a.umar, 'acc-umar', 'umar')}
      </div>
      <div class="acc-field">
        <label class="acc-label">تاریخ گرفتاری</label>
        <input class="form-input" id="acc-arrest" type="date" dir="ltr" value="${_escA(a.arrest_date)}">
      </div>
    </div>

    <!-- حلیہ (رنگ، چہرہ، جسم، قد، نشان — ایک لائن) -->
    <div class="acc-section">حلیہ</div>
    <div class="acc-grid5">
      ${dd('رنگ',   ACC_RANG,   a.rang,   'acc-rang')}
      ${dd('چہرہ',  ACC_CHEHRA, a.chehra, 'acc-chehra')}
      ${dd('جسم',   ACC_JISM,   a.jism,   'acc-jism')}
      ${dd('قد',    ACC_QAD,    a.qad,    'acc-qad', 'ltr')}
      <div class="acc-field">
        <label class="acc-label">نشان</label>
        ${_accCustomSelect(ACC_NISHAN, a.nishan, 'acc-nishan', 'nishan')}
      </div>
    </div>

    <!-- Photo + CNIC copy uploads -->
    <div class="acc-grid" style="margin-top:12px;">
      <div style="display:flex;flex-direction:column;">
        <input type="file" id="acc-photo-input" accept="image/*" capture="environment" style="display:none;" onchange="_accPhotoSelect(this)">
        <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="document.getElementById('acc-photo-input').click()">📷 تصویر ملزم</button>
        <div id="acc-photo-preview" style="margin-top:6px;text-align:center;">${_accusedPhoto?`<img src="${_accusedPhoto}" style="max-width:80px;border-radius:6px;">`:''}</div>
      </div>
      <div style="display:flex;flex-direction:column;">
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

  const _umar   = document.getElementById('acc-umar')?.value;
  const _nishan = document.getElementById('acc-nishan')?.value;

  const rec = {
    case_id: _accusedCaseId,
    name,
    accused_type: _accusedFormType || 'fir',
    cnic: document.getElementById('acc-cnic')?.value.trim() || null,
    mobile: document.getElementById('acc-mobile')?.value.trim() || null,
    arrest_date: document.getElementById('acc-arrest')?.value || null,
    pesha: document.getElementById('acc-pesha')?.value.trim() || null,
    taleem: document.getElementById('acc-taleem')?.value || null,
    rang: document.getElementById('acc-rang')?.value || null,
    chehra: document.getElementById('acc-chehra')?.value || null,
    jism: document.getElementById('acc-jism')?.value || null,
    qad: document.getElementById('acc-qad')?.value || null,
    umar: (_umar && _umar !== '__add__') ? _umar : null,
    nishan: (_nishan && _nishan !== '__add__') ? _nishan : null,
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
function _escA(s) { return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Bind keyboard navigation once (capture phase so it beats native arrow-on-select)
if (typeof window !== 'undefined' && !window._accKeyNavBound) {
  document.addEventListener('keydown', _accKeyNav, true);
  window._accKeyNavBound = true;
}
