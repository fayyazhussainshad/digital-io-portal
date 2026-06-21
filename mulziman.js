/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ملزمان (ACCUSED / SUSPECTS) MODULE
   Pattern mirrors witnesses.js — list + add/edit modal
   ═══════════════════════════════════════════════════════════ */

let _accusedList   = [];
let _accusedCaseId = null;
let _accusedPhoto  = null;   // base64 of accused photo
let _accusedCnicCopy = null; // base64 of CNIC copy

// Physical description dropdown options
const ACC_RANG   = ['گندمی','گورا','سانولا','کالا','زرد'];
const ACC_CHEHRA = ['گول','لمبا','بیضوی','چوڑا'];
const ACC_JISM   = ['دبلا','موٹا','درمیانہ','مضبوط'];
const ACC_QAD    = ['پستہ','درمیانہ','لمبا','نہایت لمبا'];
const ACC_NISHAN = ['کوئی نہیں','چہرے پر','بازو پر','ہاتھ پر','گردن پر','دیگر'];

// ── ENTRY POINT (called from misal-docs when ملزمان button pressed) ──
async function openAccusedCard(caseId) {
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
function _renderAccusedArea() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  area.innerHTML = `
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:flex-start;margin-bottom:12px;">
      <button class="btn btn-primary btn-sm" onclick="_openAccusedForm()">➕ ملزم درج کریں</button>
    </div>
    <div id="accused-list-box">${_renderAccusedList()}</div>
  </div>`;
}

function _renderAccusedList() {
  if (!_accusedList.length) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">👤</div>
      <div style="font-size:14px;">ابھی کوئی ملزم درج نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "ملزم درج کریں" پر کلک کریں</div>
    </div>`;
  }
  return `
  <div style="overflow-x:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;direction:rtl;">
    <thead>
      <tr style="background:var(--bg-secondary);">
        <th style="${_accTh()}">نام و پتہ</th>
        <th style="${_accTh()}">شناختی کارڈ</th>
        <th style="${_accTh()}">موبائل</th>
        <th style="${_accTh()}">علیہ</th>
        <th style="${_accTh()}">تاریخ گرفتاری</th>
        <th style="${_accTh()}">ایکشن</th>
      </tr>
    </thead>
    <tbody>
      ${_accusedList.map(a => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="${_accTd()}">
          <div style="display:flex;align-items:center;gap:8px;">
            ${a.photo_url ? `<img src="${a.photo_url}" style="width:34px;height:34px;border-radius:6px;object-fit:cover;">` : '<span style="font-size:20px;">👤</span>'}
            <span style="font-weight:700;">${_escA(a.name)}</span>
          </div>
        </td>
        <td style="${_accTd()}" dir="ltr">${_escA(a.cnic)||'—'}</td>
        <td style="${_accTd()}" dir="ltr">${_escA(a.mobile)||'—'}</td>
        <td style="${_accTd()}">${_escA(a.aliha)||'—'}</td>
        <td style="${_accTd()}" dir="ltr">${_escA(a.arrest_date)||'—'}</td>
        <td style="${_accTd()}">
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openAccusedForm('${a.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteAccused('${a.id}')">🗑️</button>
            ${a.cnic_copy_url ? `<button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="window.open('${a.cnic_copy_url}','_blank')" title="شناختی کارڈ کاپی">🪪</button>` : ''}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
  </div>`;
}

// ── ADD / EDIT MODAL ──────────────────────────────────────────
function _openAccusedForm(id) {
  const a = id ? (_accusedList.find(x => x.id === id) || {}) : {};
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
    <!-- نام + ولد/والدہ -->
    <label class="form-label">نام و پتہ ملزم</label>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <input class="form-input" id="acc-name" value="${_escA(a.name)}" placeholder="نام، ولدیت، پتہ" style="flex:2;">
      <select class="form-input" id="acc-relation" style="flex:0 0 90px;">
        <option value="ولد" ${a.relation==='ولد'?'selected':''}>ولد</option>
        <option value="والدہ" ${a.relation==='والدہ'?'selected':''}>والدہ</option>
      </select>
    </div>

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
        <label class="form-label">علیہ (دفعات)</label>
        <input class="form-input" id="acc-aliha" value="${_escA(a.aliha)}" placeholder="مثلاً: 302/324 ت پ">
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
    relation: document.getElementById('acc-relation')?.value || 'ولد',
    cnic: document.getElementById('acc-cnic')?.value.trim() || null,
    mobile: document.getElementById('acc-mobile')?.value.trim() || null,
    arrest_date: document.getElementById('acc-arrest')?.value || null,
    aliha: document.getElementById('acc-aliha')?.value.trim() || null,
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
    if (id) {
      await supabaseClient.from('case_accused').update(rec).eq('id', id);
    } else {
      await supabaseClient.from('case_accused').insert(rec);
    }
    _accusedPhoto = null; _accusedCnicCopy = null;
    closeModal();
    await _loadAccused();
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
