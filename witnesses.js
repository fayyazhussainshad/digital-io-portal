/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — WITNESSES / PERSONS (per case, universal)
   Compact horizontal strip cards + cross-reference
   FORM FIELDS unchanged — format/font/settings mirrored from
   mulziman.js (centered Nastaliq labels, centered inputs, grid,
   CNIC/phone auto-format, keyboard navigation).
   ═══════════════════════════════════════════════════════════ */

// Default witness status options (officer can add custom via +)
const WITNESS_STATUS = [
  { v:'fir_eye',  label:'FIR چشم دید' },
  { v:'tatima',   label:'تتمہ بیان' },
  { v:'fard',     label:'فرد' },
  { v:'mazroob',  label:'مضروب' },
  { v:'victim',   label:'Victim' },
  { v:'maghvi',   label:'مغوی' },
  { v:'mudai',    label:'مدعی' },
  { v:'moharrir', label:'محرر / FIR writer' },
  { v:'shanakht_naash',    label:'شناخت نعش' },
  { v:'postmortem',        label:'پوسٹمارٹم' },
  { v:'naqsha_navees',     label:'نقشہ نویس' },
  { v:'tafteeshi_officer', label:'تفتیشی افیسر' },
];

let _witnessList = [];
let _witnessCaseId = null;
let _editingWitnessId = null;
let _witnessFormType = 'fir';

let _personMode = 'witness'; // 'witness' or 'accused'
let _witnessViewType = 'fir';

async function openWitnessesCard(caseId, type) {
  _personMode = 'witness';
  _witnessViewType = type || 'fir';
  _witnessFormType = _witnessViewType;
  _witnessCaseId = caseId || _misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadWitnesses();
  _renderWitnessesArea();
}

// openAccusedCard moved to mulziman.js (dedicated accused module)

async function _loadWitnesses() {
  try {
    const { data } = await supabaseClient
      .from('case_witnesses').select('*')
      .eq('case_id', _witnessCaseId)
      .order('created_at', { ascending: true });
    _witnessList = data || [];
  } catch(_) { _witnessList = []; }
}

// ── FORM CSS (injected once — mirrors mulziman's acc-form styling) ──
function _witInjectCSS() {
  if (document.getElementById('wit-form-css')) return;
  const s = document.createElement('style');
  s.id = 'wit-form-css';
  s.textContent = `
  .wit-form{direction:rtl;text-align:right;}
  .wit-form .wit-label{
    display:block;font-size:14pt !important;font-weight:700;text-align:center;
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
    margin:8px 0 4px;color:var(--text,#111);line-height:1.6;
  }
  .wit-form .wit-field{display:flex;flex-direction:column;}
  .wit-form .wit-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 10px;align-items:start;}
  .wit-form .wit-grid5{display:grid;grid-template-columns:4fr 1.4fr 1.2fr 0.9fr 1.1fr;gap:6px 8px;align-items:start;}
  .wit-form .form-input{width:100%;box-sizing:border-box;font-size:14pt !important;padding:5px 6px;}
  .wit-form select.form-input,.wit-form input.form-input{text-align:center;font-size:14pt !important;}
  @media(max-width:640px){.wit-form .wit-grid5{grid-template-columns:1fr 1fr;}}

  /* Saved witnesses list — aligned columns, RTL names, 14pt */
  .wit-list-grid{display:grid;grid-template-columns:2.2em 4fr 1.4fr 1.2fr 0.9fr 1.1fr 92px;gap:6px 8px;align-items:center;direction:rtl;min-width:640px;box-sizing:border-box;}
  .wit-list-grid > div{font-size:14pt !important;text-align:center;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .wit-list-grid > div:nth-child(2){text-align:right;direction:rtl;}
  .wit-list-head{padding:4px 12px;border:1px solid transparent;border-right:3px solid transparent;}
  .wit-list-head > div{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-weight:700;color:var(--text-muted);font-size:14pt !important;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.25;}
  .wit-list-head > div:nth-child(2){text-align:right;}
  .wit-list-row{background:var(--bg-card);border:1px solid var(--border);border-right:3px solid var(--accent);border-radius:8px;padding:8px 12px;margin-bottom:7px;}
  .wit-list-row .wit-idx{font-weight:800;color:var(--accent);font-size:14pt !important;}
  .wit-list-row .wit-name{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-weight:700;}
  .wit-list-row .wit-actions{display:flex;gap:5px;overflow:visible;}
  @media(max-width:560px){.wit-form .wit-grid3{grid-template-columns:1fr 1fr;}}
  `;
  document.head.appendChild(s);
}

// ── FORCE 14pt (inline !important beats index.html's global font rule) ──
// The app's global CSS forces font-size with ID-level specificity + !important,
// which defeats stylesheet rules. Inline !important (set via JS) always wins.
function _witForce14() {
  try {
    const sel = '#witness-form-box .wit-label, #witness-form-box .form-input,'
              + ' .wit-list-head > div, .wit-list-row > div:not(.wit-actions)';
    document.querySelectorAll(sel).forEach(el => {
      el.style.setProperty('font-size', '14pt', 'important');
    });
  } catch(_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
}

function _renderWitnessesArea() {
  _witInjectCSS();
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const isCross = _witnessViewType === 'cross_version';
  const list = _witnessList.filter(w => (w.witness_type || 'fir') === _witnessViewType);
  const heading = isCross ? 'گواہان کراس ورژن' : 'گواہان FIR';
  const color = isCross ? 'var(--amber)' : 'var(--accent)';
  area.innerHTML = `
  <div id="wit-area" style="padding:10px;direction:rtl;height:100%;overflow-y:auto;width:100%;box-sizing:border-box;">
    <div style="border-bottom:2px solid ${color};margin-bottom:12px;padding-bottom:6px;">
      <div style="position:relative;min-height:34px;display:flex;align-items:center;justify-content:center;">
        <div class="dio-hs1" style="font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};text-align:center;">${heading}</div>
        <button class="btn btn-primary btn-sm" style="position:absolute;right:0;top:50%;transform:translateY(-50%);" onclick="_openWitnessForm(null,'${_witnessViewType}')">گواہ</button>
      </div>
    </div>
    <div style="width:100%;overflow-x:auto;">${_renderWitnessList(list, _witnessViewType)}</div>
  </div>`;
  _witForce14();
}

// Built-in case persons who are automatically considered witnesses:
// مدعی (complainant), محرر/FIR writer, مضروب/مغوی/victim if recorded on the case
// Saved witnesses — aligned rows (same column widths & 14pt as the form)
function _renderWitnessList(list, type) {
  list = list || _witnessList;
  if (!list.length) {
    return `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:14px;">کوئی گواہ شامل نہیں</div>`;
  }
  const head = `
    <div class="wit-list-grid wit-list-head">
      <div></div>
      <div>نام</div>
      <div>شناختی کارڈ</div>
      <div>فون نمبر</div>
      <div>پیشہ</div>
      <div>حیثیت</div>
      <div></div>
    </div>`;
  const rows = list.map((w, i) => {
    const statusLabel = (WITNESS_STATUS.find(s => s.v === w.status) || {}).label || w.status || '—';
    return `
    <div class="wit-list-grid wit-list-row">
      <div class="wit-idx">${i+1}</div>
      <div class="wit-name">${esc(w.full_name)||'—'}</div>
      <div dir="ltr">${w.cnic?esc(w.cnic):'—'}</div>
      <div dir="ltr">${w.cell?esc(w.cell):'—'}</div>
      <div>${w.profession?esc(w.profession):'—'}</div>
      <div>${esc(statusLabel)}</div>
      <div class="wit-actions">
        <button title="ترمیم" aria-label="ترمیم" class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openWitnessForm('${w.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
        <button title="حذف" aria-label="حذف" class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteWitness('${w.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
      </div>
    </div>`;
  }).join('');
  return head + rows;
}

// ── ADD / EDIT — «نیا اندراج — گواہ» (مشترکہ DIO کارڈ، اکتوبر 2026) ──
function _witCustomStatuses() {
  try { return JSON.parse(localStorage.getItem('dio_wit_status_custom') || '[]'); } catch (_) { return []; }
}
function _witStatusChange(sel) {
  if (sel.value !== '__add__') return;
  const v = (prompt('نئی حیثیت لکھیں:') || '').trim();
  if (!v) { sel.value = ''; return; }
  const l = _witCustomStatuses();
  if (!l.includes(v)) { l.push(v); try { localStorage.setItem('dio_wit_status_custom', JSON.stringify(l)); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ } }
  const addOpt = sel.querySelector('option[value="__add__"]');
  const opt = document.createElement('option');
  opt.value = v; opt.textContent = v;
  sel.insertBefore(opt, addOpt);
  sel.value = v;
}
async function _openWitnessForm(id, type, opts) {
  _witInjectCSS();
  opts = opts || {};
  const D = window.DIOCard;
  _editingWitnessId = id || null;
  const w = id ? (_witnessList.find(x => x.id === id) || {}) : {};
  _witnessFormType = type || w.witness_type || 'fir';
  const photos = (Array.isArray(w.photos) && w.photos.length) ? w.photos : (w.photo_url ? [w.photo_url] : []);
  D.setFiles('wit-photos', photos);
  D.setFiles('wit-cnicF', w.cnic_copy_url ? [w.cnic_copy_url] : []);
  D.setFiles('wit-cnicB', w.cnic_back_url ? [w.cnic_back_url] : []);

  const known = WITNESS_STATUS.map(s => [s.v, s.label]);
  _witCustomStatuses().forEach(c => { if (!known.some(k => k[0] === c)) known.push([c, c]); });
  if (w.status && !known.some(k => k[0] === w.status)) known.push([w.status, w.status]);
  const statusOpts = [['', '—']].concat(known, [['__add__', '+ نئی حیثیت شامل کریں']]);

  const caseId = w.case_id || opts.caseId || (opts.hub ? '' : _witnessCaseId) || '';
  const typeSel = D.fld({ id: 'w-type', label: 'گواہ کی قسم', type: 'sel', w: 'w-l',
    opts: [['fir', 'FIR گواہان'], ['cross_version', 'کراس ورژن گواہان']], value: _witnessFormType });

  const body = `
  <div class="acc-form">
    ${await D.caseField(caseId, typeSel)}
    ${D.nameField('w-name', w.full_name, 'نام و پتہ', true)}
    ${D.row([
      D.fld({ id: 'w-cnic', label: 'شناختی کارڈ', type: 'cnic', value: w.cnic }),
      D.fld({ id: 'w-cell', label: 'فون نمبر', type: 'mob', value: w.cell }),
      D.fld({ id: 'w-status', label: 'حیثیت', type: 'sel', w: 'w-l', pair: true, opts: statusOpts, value: w.status || '', attrs: 'onchange="_witStatusChange(this)"' }),
      D.fld({ id: 'w-profession', label: 'پیشہ', w: 'w-m', grow: true, pair: true, value: w.profession, ph: 'پیشہ' })
    ])}
    ${D.uploads([
      ['wit-photos', 'تصاویر گواہ', 'ایک سے زیادہ', true, 6],
      ['wit-cnicF', 'شناختی کارڈ — سامنے', '', false, 1],
      ['wit-cnicB', 'شناختی کارڈ — پیچھے', '', false, 1]
    ])}
    ${window.DIOPrev ? DIOPrev.panel(w.prev_records) : ''}
  </div>`;

  D.open('گواہ', !!id, body, '_saveWitness()');
  if (window.DIOPrev) {
    const nameIds = document.getElementById('w-name') ? ['w-name'] : ['w-name-n'];
    DIOPrev.watch({ nameIds, cnicId: 'w-cnic', selfTable: 'case_witnesses', selfId: id || null, caseId: caseId || null });
  }
}


// ── KEYBOARD BEHAVIOUR (identical to mulziman's _accKeyNav) ──
//  • Tab / Shift+Tab  → next / previous field  (native)
//  • Up / Down        → work INSIDE the field only (native)
//  • Left / Right     → move text cursor; on a dropdown they do NOTHING
//  • Space            → open the focused dropdown
function _witKeyNav(e) {
  const form = document.querySelector('.wit-form');
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
    if (typeof t.showPicker === 'function') { e.preventDefault(); try { t.showPicker(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
  }
  // Tab, Up/Down and cursor keys in text = native (stay within the field)
}
if (typeof window !== 'undefined' && !window._witKeyNavBound) {
  document.addEventListener('keydown', _witKeyNav, true);
  window._witKeyNavBound = true;
}


async function _saveWitness() {
  const D = window.DIOCard;
  const cs = D.readCase();
  const caseId = cs ? cs.id : (document.getElementById('dio-case') ? null : _witnessCaseId);   // کارڈ میں مقدمہ کا خانہ ہو تو وہی لازمی
  const status = document.getElementById('w-status')?.value || null;
  const photos = D.getFiles('wit-photos');
  const rec = {
    case_id: caseId,
    full_name: D.readName('w-name') || null,
    profession: document.getElementById('w-profession')?.value.trim() || null,
    cell: document.getElementById('w-cell')?.value.trim() || null,
    cnic: document.getElementById('w-cnic')?.value.trim() || null,
    status: status === '__add__' ? null : status,
    witness_type: document.getElementById('w-type')?.value || _witnessFormType || 'fir',
    // نئے کالم (sql/101) — نہ ہوں تو ان کے بغیر محفوظ ہوگا
    photo_url: photos[0] || null,
    photos: photos,
    cnic_copy_url: D.getFiles('wit-cnicF')[0] || null,
    cnic_back_url: D.getFiles('wit-cnicB')[0] || null,
    prev_records: window.DIOPrev ? DIOPrev.read() : [],
  };
  if (!rec.full_name) { showToast('نام ضروری ہے', 'error'); return; }
  if (!caseId) { showToast('مقدمہ منتخب کریں', 'error'); document.getElementById('dio-case')?.focus(); return; }
  if (rec.cnic && rec.cnic.replace(/\D/g, '').length !== 13) { showToast('شناختی کارڈ کے 13 ہندسے لکھیں', 'error'); return; }
  const OPTIONAL = ['photo_url', 'photos', 'cnic_copy_url', 'cnic_back_url', 'prev_records'];
  try {
    const oid = await getOfficerId();
    if (oid) rec.officer_id = oid;
    const isNew = !_editingWitnessId;
    await D.safeWrite('case_witnesses', isNew ? 'insert' : 'update', rec, _editingWitnessId, OPTIONAL);
    if (isNew) {
      // ضمنی نقل (تلاش کے لیے) — گواہ خود محفوظ ہو چکا؛ ناکامی صرف درج ہو (v547: پہلے رد بھی خاموش)
      try {
        dioWriteOk(await supabaseClient.from('suspects').insert({
          officer_id: oid, person_type: 'witness',
          full_name: rec.full_name, profession: rec.profession,
          cnic: rec.cnic, cell: rec.cell,
        }), 'gawah: suspects copy');
      } catch (_) { /* dioWriteOk نے درج کر دیا — گواہ کا اندراج نہ رکے */ }
    }
    if (typeof closeModal === 'function') closeModal();
    _witnessFormType = 'fir';  // reset
    // اسی مقدمے کی گواہان فہرست کھلی ہو تو تازہ کرو (Dashboard سے اندراج پر صفحہ نہ بدلے)
    if (String(caseId) === String(_witnessCaseId) && document.getElementById('wit-area')) {
      await _loadWitnesses();
      _renderWitnessesArea();
    }
    showToast('گواہ محفوظ ہو گیا' + (cs && cs.fir && String(caseId) !== String(_witnessCaseId) ? ' — مقدمہ ' + cs.fir : ''), 'success');
  } catch (e) { dioWriteFail('گواہ', e, 'محفوظ نہیں ہوا'); }
}

async function _deleteWitness(id) {
  if (!confirm('کیا آپ یہ گواہ حذف کرنا چاہتے ہیں؟')) return;
  try {
    // v547: نتیجہ دیکھ کر — پہلے سرور رد کرتا تب بھی «حذف ہو گیا»
    dioWriteOk(await supabaseClient.from('case_witnesses').delete().eq('id', id).select('id'), 'witness delete', true);
    await _loadWitnesses();
    _renderWitnessesArea();
    showToast('حذف ہو گیا','info');
  } catch(e) { dioWriteFail('گواہ', e, 'حذف نہیں ہوا'); }
}

