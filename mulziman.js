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
  .acc-form{direction:rtl;text-align:right;width:700px;max-width:94vw;margin:0 auto;}
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
  .acc-form .acc-gridN{display:grid;grid-template-columns:2.6fr 1fr 1fr;gap:7px 10px;align-items:center;}
  .acc-form .acc-grid4b{display:grid;grid-template-columns:1.3fr 1fr 1.35fr 1fr;gap:7px 10px;align-items:center;}
  .acc-form .acc-grid5{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:7px 8px;align-items:center;}
  .acc-form .form-input{flex:1;min-width:0;width:auto;box-sizing:border-box;font-size:14pt;padding:5px 6px;}
  .acc-form select.form-input,.acc-form input.form-input{text-align:center;}
  @media(max-width:640px){
    .acc-form .acc-grid5{grid-template-columns:1fr 1fr 1fr;}
    .acc-form .acc-gridN{grid-template-columns:1fr 1fr;}
    .acc-form .acc-grid4b{grid-template-columns:1fr 1fr;}
  }
  @media(max-width:560px){.acc-form .acc-grid3{grid-template-columns:1fr 1fr;}}
  @keyframes accBlink{0%,100%{opacity:1;}50%{opacity:0.4;}}
  .acc-blink{
    animation:accBlink 0.9s steps(1,end) infinite;
    background:#f59e0b!important;color:#fff!important;border-color:#f59e0b!important;
    font-weight:700;
  }
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
      <div style="flex:1;font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};text-align:center;">${heading}</div>
    </div>
    <div id="acc-list" style="width:100%;">${_renderAccCards(list)}</div>
  </div>`;

  // Background: blink the سابقہ ریکارڈ button for anyone with a record in other cases
  _accCheckPrevRecords(list);
}

function _renderAccCards(list) {
  if (!list.length) {
    return `<div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">
      <div style="font-size:30px;margin-bottom:6px;">👤</div>
      کوئی ملزم نہیں
    </div>`;
  }
  return list.map(a => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
      <div onclick="_accViewDetail('${a.id}')" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:pointer;">
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
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button class="btn btn-secondary btn-sm" style="padding:2px 7px;" title="ترمیم" onclick="event.stopPropagation();_openAccusedForm('${a.id}','${a.accused_type||'fir'}')">✏️</button>
        <button id="acc-prev-btn-${a.id}" class="btn btn-secondary btn-sm" style="padding:2px 7px;" title="سابقہ ریکارڈ" onclick="event.stopPropagation();_accPrevRecord('${a.id}')">📋 سابقہ ریکارڈ</button>
        <button class="btn btn-danger btn-sm" style="padding:2px 7px;" title="حذف" onclick="event.stopPropagation();_deleteAccused('${a.id}')">🗑️</button>
      </div>
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

    <!-- نام و پتہ | تعلیم | عمر (ایک لائن) -->
    <div class="acc-gridN">
      <div class="acc-field">
        <label class="acc-label">نام و پتہ</label>
        <input class="form-input" id="acc-name" value="${_escA(a.name)}" placeholder="نام، ولدیت، پتہ" style="text-align:right;">
      </div>
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
    </div>

    <!-- شناختی کارڈ | موبائل | تاریخ گرفتاری | پیشہ (ایک لائن) -->
    <div class="acc-grid4b" style="margin-top:7px;">
      <div class="acc-field">
        <label class="acc-label">شناختی کارڈ</label>
        <input class="form-input" id="acc-cnic" dir="ltr" maxlength="15" value="${_escA(a.cnic)}" placeholder="00000-0000000-0" oninput="_fmtCnicInput(this)">
      </div>
      <div class="acc-field">
        <label class="acc-label">موبائل</label>
        <input class="form-input" id="acc-mobile" dir="ltr" maxlength="12" value="${_escA(a.mobile)}" placeholder="0000-0000000" oninput="_fmtMobileInput(this)">
      </div>
      <div class="acc-field">
        <label class="acc-label">تاریخ گرفتاری</label>
        <input class="form-input" id="acc-arrest" type="date" dir="ltr" value="${_escA(a.arrest_date)}">
      </div>
      <div class="acc-field">
        <label class="acc-label">پیشہ</label>
        <input class="form-input" id="acc-pesha" value="${_escA(a.pesha)}" placeholder="مثلاً: مزدور">
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
        <div id="acc-photo-preview" style="margin-top:6px;text-align:center;">${_accThumb('photo', _accusedPhoto)}</div>
      </div>
      <div style="display:flex;flex-direction:column;">
        <input type="file" id="acc-cnic-input" accept="image/*,application/pdf" style="display:none;" onchange="_accCnicSelect(this)">
        <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="document.getElementById('acc-cnic-input').click()">🪪 شناختی کارڈ کاپی</button>
        <div id="acc-cnic-preview" style="margin-top:6px;text-align:center;">${_accThumb('cnic', _accusedCnicCopy)}</div>
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
  _compressImg(f, 900, 0.78, (b64) => {
    _accusedPhoto = b64;
    const p = document.getElementById('acc-photo-preview');
    if (p) p.innerHTML = _accThumb('photo', b64);
  });
}
function _accCnicSelect(input) {
  const f = input.files[0]; if (!f) return;
  if (f.type === 'application/pdf') {
    const r = new FileReader();
    r.onload = e => { _accusedCnicCopy = e.target.result; const p=document.getElementById('acc-cnic-preview'); if(p)p.innerHTML=_accThumb('cnic', e.target.result); };
    r.readAsDataURL(f);
  } else {
    _compressImg(f, 1400, 0.8, (b64) => {
      _accusedCnicCopy = b64;
      const p = document.getElementById('acc-cnic-preview');
      if (p) p.innerHTML = _accThumb('cnic', b64);
    });
  }
}
// Clickable thumbnail for the form previews (opens viewer with print/download)
function _accThumb(which, url) {
  if (!url) return '';
  const isPdf = /^data:application\/pdf/.test(url);
  const inner = isPdf
    ? `<div style="width:120px;height:120px;border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:44px;background:var(--bg-card);">📄</div>`
    : `<img src="${url}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">`;
  return `<div onclick="_accViewCurrent('${which}')" style="cursor:pointer;display:inline-block;">
      ${inner}
      <div style="font-size:11px;color:var(--green);margin-top:3px;">✅ منسلک — کھولیں</div>
    </div>`;
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

// ── READ-ONLY DETAIL VIEW (name click) — edit ONLY via ترمیم btn ──
function _accViewDetail(id) {
  const a = _accusedList.find(x => x.id === id);
  if (!a) return;
  const row = (label, val) => val ? `<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px dashed var(--border);">
      <span style="font-weight:700;min-width:120px;">${label}</span>
      <span style="flex:1;">${_escA(val)}</span></div>` : '';
  const haleeya = [
    a.rang   && ('رنگ: '   + a.rang),
    a.chehra && ('چہرہ: '  + a.chehra),
    a.jism   && ('جسم: '   + a.jism),
    a.qad    && ('قد: '    + a.qad),
    a.nishan && ('نشان: '  + a.nishan)
  ].filter(Boolean).join(' ، ');

  const thumbs = (a.photo_url || a.cnic_copy_url) ? `
    <div style="display:flex;gap:14px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
      ${a.photo_url ? `<div style="text-align:center;">
        <img src="${a.photo_url}" onclick="_accViewDoc('${a.id}','photo')" style="width:120px;height:120px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">📷 تصویر (کھولیں)</div></div>` : ''}
      ${a.cnic_copy_url ? `<div style="text-align:center;">
        ${/^data:application\/pdf/.test(a.cnic_copy_url)
          ? `<div onclick="_accViewDoc('${a.id}','cnic')" style="width:120px;height:120px;border-radius:8px;cursor:pointer;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:44px;background:var(--bg-card);">📄</div>`
          : `<img src="${a.cnic_copy_url}" onclick="_accViewDoc('${a.id}','cnic')" style="width:120px;height:120px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--border);">`}
        <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">🪪 شناختی کاپی (کھولیں)</div></div>` : ''}
    </div>` : '';

  const body = `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
    ${row('نام و پتہ', a.name)}
    ${row('شناختی کارڈ', a.cnic)}
    ${row('موبائل', a.mobile)}
    ${row('پیشہ', a.pesha)}
    ${row('تعلیم', a.taleem)}
    ${row('عمر', a.umar)}
    ${row('تاریخ گرفتاری', a.arrest_date ? _fmtDateDMY(a.arrest_date) : '')}
    ${row('حلیہ', haleeya)}
    ${thumbs}
  </div>`;

  openModal('👤 ملزم کی تفصیل', body, `
    <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
    <button class="btn btn-primary" onclick="closeModal();_openAccusedForm('${a.id}','${a.accused_type||'fir'}')">✏️ ترمیم</button>
  `);
}

// ── PHOTO / CNIC-COPY VIEWER (view • print • download) ─────────
let _accViewUrl = null;
let _accViewName = 'file';

// From a saved record (detail view / list card)
function _accViewDoc(id, which) {
  const a = _accusedList.find(x => x.id === id);
  if (!a) return;
  const url = which === 'cnic' ? a.cnic_copy_url : a.photo_url;
  if (!url) { showToast('کوئی فائل موجود نہیں', 'info'); return; }
  _accOpenViewer(url,
    ((a.name || 'mulzim').replace(/\s+/g,'_')) + '_' + which,
    which === 'cnic' ? '🪪 شناختی کارڈ کاپی' : '📷 تصویر ملزم');
}
// From the OPEN edit form (uses in-memory just-attached files, keeps form alive)
function _accViewCurrent(which) {
  const url = which === 'cnic' ? _accusedCnicCopy : _accusedPhoto;
  if (!url) return;
  _accOpenViewer(url, 'mulzim_' + which,
    which === 'cnic' ? '🪪 شناختی کارڈ کاپی' : '📷 تصویر ملزم');
}
// Independent overlay lightbox (does NOT replace whatever modal is behind it)
function _accOpenViewer(url, name, title) {
  _accViewUrl = url;
  _accViewName = name || 'file';
  const isPdf = /^data:application\/pdf/.test(url);
  const viewer = isPdf
    ? `<iframe src="${url}" style="width:80vw;height:74vh;border:none;background:#fff;border-radius:6px;"></iframe>`
    : `<img src="${url}" style="max-width:88vw;max-height:74vh;border-radius:6px;display:block;margin:0 auto;">`;
  _accCloseViewer();
  const ov = document.createElement('div');
  ov.id = 'acc-lightbox';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
  ov.innerHTML = `
    <div style="background:var(--bg,#fff);border-radius:10px;padding:12px;max-width:96vw;max-height:92vh;overflow:auto;direction:rtl;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
        <strong style="font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;">${title}</strong>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="_accDownloadDoc()">⬇️ ڈاؤن لوڈ</button>
          <button class="btn btn-primary btn-sm" onclick="_accPrintDoc()">🖨️ پرنٹ</button>
          <button class="btn btn-danger btn-sm" onclick="_accCloseViewer()">✕</button>
        </div>
      </div>
      <div style="text-align:center;">${viewer}</div>
    </div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) _accCloseViewer(); });
  document.body.appendChild(ov);
}
function _accCloseViewer() {
  const ov = document.getElementById('acc-lightbox');
  if (ov) ov.remove();
}
function _accDownloadDoc() {
  if (!_accViewUrl) return;
  const isPdf = /^data:application\/pdf/.test(_accViewUrl);
  const el = document.createElement('a');
  el.href = _accViewUrl;
  el.download = _accViewName + (isPdf ? '.pdf' : '.jpg');
  document.body.appendChild(el); el.click(); el.remove();
}
function _accPrintDoc() {
  if (!_accViewUrl) return;
  const w = window.open('', '_blank');
  if (!w) { showToast('پاپ اپ کی اجازت دیں', 'error'); return; }
  const isPdf = /^data:application\/pdf/.test(_accViewUrl);
  const content = isPdf
    ? `<iframe src="${_accViewUrl}" style="width:100%;height:100vh;border:none;" onload="setTimeout(function(){window.focus();window.print();},400)"></iframe>`
    : `<img src="${_accViewUrl}" style="max-width:100%;" onload="setTimeout(function(){window.focus();window.print();},400)">`;
  w.document.write('<!DOCTYPE html><html><head><title>' + _accViewName + '</title></head><body style="margin:0;text-align:center;">' + content + '</body></html>');
  w.document.close();
}

// ── سابقہ ریکارڈ (record of this accused in OTHER cases) ───────
// Batch check: blink the button for anyone who has a record elsewhere
async function _accCheckPrevRecords(list) {
  if (!navigator.onLine || !list || !list.length) return;
  const cnics = [...new Set(list.map(a => a.cnic).filter(Boolean))];
  const names = [...new Set(list.filter(a => !a.cnic && a.name).map(a => a.name))];
  const matchedCnic = new Set(), matchedName = new Set();
  try {
    if (cnics.length) {
      const { data } = await supabaseClient.from('case_accused')
        .select('cnic,case_id').neq('case_id', _accusedCaseId).in('cnic', cnics);
      (data || []).forEach(r => { if (r.cnic) matchedCnic.add(r.cnic); });
    }
    if (names.length) {
      const { data } = await supabaseClient.from('case_accused')
        .select('name,case_id').neq('case_id', _accusedCaseId).in('name', names);
      (data || []).forEach(r => { if (r.name) matchedName.add(r.name); });
    }
  } catch(_) { return; }
  list.forEach(a => {
    const has = (a.cnic && matchedCnic.has(a.cnic)) || (!a.cnic && a.name && matchedName.has(a.name));
    if (has) {
      const btn = document.getElementById('acc-prev-btn-' + a.id);
      if (btn) { btn.classList.add('acc-blink'); btn.title = '⚠️ سابقہ ریکارڈ موجود ہے — چیک کریں'; }
    }
  });
}

async function _accPrevRecord(id) {
  const a = _accusedList.find(x => x.id === id);
  if (!a) return;
  if (!a.cnic && !a.name) { showToast('شناخت دستیاب نہیں', 'info'); return; }
  if (!navigator.onLine) { showToast('سابقہ ریکارڈ کے لیے انٹرنیٹ درکار ہے', 'info'); return; }
  showToast('🔎 تلاش جاری...', 'info');
  try {
    let q = supabaseClient.from('case_accused').select('*').neq('case_id', _accusedCaseId);
    if (a.cnic) q = q.eq('cnic', a.cnic); else q = q.ilike('name', a.name);
    const { data: recs } = await q;
    const list = recs || [];
    if (!list.length) {
      openModal('📋 سابقہ ریکارڈ', `<div style="direction:rtl;text-align:center;padding:24px;color:var(--text-muted);">اس ملزم کا کسی دیگر مقدمہ میں کوئی ریکارڈ نہیں ملا۔</div>`,
        `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
      return;
    }
    // Fetch case labels for the matched records
    const ids = [...new Set(list.map(r => r.case_id).filter(Boolean))];
    const caseMap = {};
    if (ids.length) {
      try {
        const { data: cases } = await supabaseClient.from('cases').select('*').in('id', ids);
        (cases || []).forEach(c => { caseMap[c.id] = c; });
      } catch(_) {}
    }
    const rows = list.map(r => {
      const label = _accCaseLabel(caseMap[r.case_id], r.case_id);
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:9px 11px;margin-bottom:6px;direction:rtl;">
        <div style="font-weight:700;font-size:14px;">${_escA(label)}</div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;gap:10px;flex-wrap:wrap;margin-top:3px;">
          ${r.name?`<span>${_escA(r.name)}</span>`:''}
          ${r.cnic?`<span dir="ltr">🪪 ${_escA(r.cnic)}</span>`:''}
          ${r.pesha?`<span>${_escA(r.pesha)}</span>`:''}
          ${r.arrest_date?`<span dir="ltr">📅 ${_fmtDateDMY(r.arrest_date)}</span>`:''}
        </div>
      </div>`;
    }).join('');
    openModal('📋 سابقہ ریکارڈ (' + list.length + ')', `<div style="direction:rtl;">${rows}</div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}
// Build a readable case label from whatever columns exist
function _accCaseLabel(c, fallbackId) {
  if (!c || !Object.keys(c).length) return 'مقدمہ #' + (fallbackId || '');
  const fir   = c.fir_no || c.fir_number || c.firno || c.muqadma_no || c.case_no || c.number || '';
  const thana = c.thana || c.police_station || c.ps || c.thana_name || '';
  const secs  = c.u_s || c.section || c.dafaat || c.offence || '';
  const parts = [];
  if (fir)   parts.push('ایف آئی آر ' + fir);
  if (thana) parts.push(thana);
  if (secs)  parts.push(secs);
  return parts.length ? parts.join(' — ') : ('مقدمہ #' + (c.id || fallbackId || ''));
}

// ── HELPERS ───────────────────────────────────────────────────
function _escA(s) { return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Bind keyboard navigation once (capture phase so it beats native arrow-on-select)
if (typeof window !== 'undefined' && !window._accKeyNavBound) {
  document.addEventListener('keydown', _accKeyNav, true);
  window._accKeyNavBound = true;
}
