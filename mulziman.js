/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ملزمان (ACCUSED / SUSPECTS) MODULE
   Pattern mirrors witnesses.js — list + add/edit modal
   ═══════════════════════════════════════════════════════════ */

let _accusedList   = [];
let _accusedCaseId = null;
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
    try { localStorage.setItem('dio_accused_' + _accusedCaseId, JSON.stringify(_accusedList)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('mulziman: local save nakaam', _); }
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
  .acc-form{direction:rtl;text-align:right;width:100%;box-sizing:border-box;}
  .acc-form *{box-sizing:border-box;}
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
  .acc-form .acc-field{display:flex;flex-direction:row;align-items:center;gap:6px;min-width:0;}
  .acc-form .acc-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;align-items:center;width:100%;}
  .acc-form .acc-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px 10px;align-items:center;width:100%;}
  .acc-form .acc-gridN{display:grid;grid-template-columns:3.2fr 1fr 1fr;gap:7px 10px;align-items:center;width:100%;}
  .acc-form .acc-grid4b{display:grid;grid-template-columns:1.9fr 1.35fr 1.95fr 1fr;gap:7px 10px;align-items:center;width:100%;}
  .acc-form .acc-grid5{display:grid;grid-template-columns:1fr 1fr 1.2fr 1fr 2.4fr;gap:7px 8px;align-items:center;width:100%;}
  .acc-form .form-input{flex:1;min-width:0;width:auto;box-sizing:border-box;font-size:14pt;padding:5px 6px;}
  .acc-form select.form-input,.acc-form input.form-input{text-align:center;}
  @media(max-width:640px){
    .acc-form .acc-grid5{grid-template-columns:1fr 1fr 1fr;}
    .acc-form .acc-gridN{grid-template-columns:2fr 1fr 1fr;}
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
      <button class="btn btn-primary btn-sm" style="flex:0 0 auto;" onclick="_openAccusedForm(null,'${_accusedViewType}')">ملزم</button>
      <div class="dio-hs1" style="flex:1;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};text-align:center;">${heading}</div>
    </div>
    <div id="acc-list" style="width:100%;">${_renderAccCards(list)}</div>
  </div>`;

  // Background: blink the سابقہ ریکارڈ button for anyone with a record in other cases
  _accCheckPrevRecords(list);
}

function _renderAccCards(list) {
  if (!list.length) {
    return `<div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">
      <div style="font-size:30px;margin-bottom:6px;"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg></div>
      کوئی ملزم نہیں
    </div>`;
  }
  return list.map(a => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
      <div onclick="_accViewDetail('${a.id}')" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:pointer;">
        ${a.photo_url ? `<img src="${esc(a.photo_url)}" style="width:38px;height:38px;border-radius:6px;object-fit:cover;flex-shrink:0;">` : '<span style="font-size:22px;flex-shrink:0;"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg></span>'}
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_escA(a.name)}</div>
          <div style="font-size:12px;color:var(--text-muted);display:flex;gap:8px;flex-wrap:wrap;">
            ${a.cnic?`<span dir="ltr">${_escA(a.cnic)}</span>`:''}
            ${a.pesha?`<span>${_escA(a.pesha)}</span>`:''}
            ${a.taleem?`<span>${_escA(a.taleem)}</span>`:''}
            ${a.umar?`<span>${_escA(a.umar)}</span>`:''}
            ${a.arrest_date?`<span dir="ltr">${_fmtDateDMY(a.arrest_date)}</span>`:''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <button aria-label="ترمیم" class="btn btn-secondary btn-sm" style="padding:2px 7px;" title="ترمیم" onclick="event.stopPropagation();_openAccusedForm('${a.id}','${a.accused_type||'fir'}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
        <button id="acc-prev-btn-${a.id}" class="btn btn-secondary btn-sm" style="padding:2px 7px;" title="سابقہ ریکارڈ" onclick="event.stopPropagation();_accPrevRecord('${a.id}')">سابقہ ریکارڈ</button>
        <button aria-label="حذف" class="btn btn-danger btn-sm" style="padding:2px 7px;" title="حذف" onclick="event.stopPropagation();_deleteAccused('${a.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
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
// ── CUSTOM-OPTION STORAGE (for عمر / نشان "+" additions) ───────
function _accCustomOpts(key) {
  try { return JSON.parse(localStorage.getItem('dio_acc_opts_' + key) || '[]'); }
  catch(_) { return []; }
}
function _accSaveCustomOpt(key, val) {
  const l = _accCustomOpts(key);
  if (!l.includes(val)) { l.push(val); try { localStorage.setItem('dio_acc_opts_' + key, JSON.stringify(l)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ } }
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
function _accCustomSelect(opts, val, fid, key, dir, cls) {
  const custom = _accCustomOpts(key);
  const all = opts.slice();
  custom.forEach(c => { if (!all.includes(c)) all.push(c); });
  if (val && !all.includes(val)) all.unshift(val);
  return `<select class="${cls||'form-input'}" id="${fid}" ${dir?`dir="${dir}"`:''} onchange="_accDdAdd(this,'${key}')">
    <option value="">—</option>
    ${all.map(o => `<option value="${_escA(o)}" ${val===o?'selected':''}>${_escA(o)}</option>`).join('')}
    <option value="__add__">+ نیا شامل کریں</option>
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
    if (typeof t.showPicker === 'function') { e.preventDefault(); try { t.showPicker(); } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
  }
  // Tab, Up/Down and cursor keys in text = native (stay within the field)
}

// ── ADD / EDIT — «نیا اندراج — ملزم» (مشترکہ DIO کارڈ، اکتوبر 2026) ──
//  opts.caseId : Dashboard کے «نیا اندراج» سے — مقدمہ پہلے سے منتخب نہیں
let _accEditId = null;
async function _openAccusedForm(id, type, opts) {
  _accInjectCSS();
  opts = opts || {};
  const D = window.DIOCard;
  const a = id ? (_accusedList.find(x => x.id === id) || {}) : {};
  _accusedFormType = type || a.accused_type || 'fir';
  _accEditId = id || null;
  const photos = (Array.isArray(a.photos) && a.photos.length) ? a.photos : (a.photo_url ? [a.photo_url] : []);
  D.setFiles('acc-photos', photos);
  D.setFiles('acc-cnicF', a.cnic_copy_url ? [a.cnic_copy_url] : []);
  D.setFiles('acc-cnicB', a.cnic_back_url ? [a.cnic_back_url] : []);

  const caseId = a.case_id || opts.caseId || (opts.hub ? '' : _accusedCaseId) || '';
  const typeSel = D.fld({ id: 'acc-type', label: 'ملزم کی قسم', type: 'sel', w: 'w-l',
    opts: [['fir', 'FIR ملزمان'], ['cross_version', 'کراس ورژن ملزمان']], value: _accusedFormType });
  const sel = (label, opts2, val, fid, key, w, dir, extra) =>
    D.fld({ id: fid, label, w, html: _accCustomSelect(opts2, val, fid, key, dir, 'dio-c' + (dir === 'ltr' ? ' ltr' : '')), grow: extra === 'grow', pair: extra === 'pair' });

  const body = `
  <div class="acc-form">
    ${await D.caseField(caseId, typeSel)}
    ${D.nameField('acc-name', a.name, 'نام و پتہ', true)}
    ${D.row([
      sel('تعلیم', ACC_TALEEM, a.taleem, 'acc-taleem', 'taleem', 'w-s'),
      sel('عمر', ACC_UMAR, a.umar, 'acc-umar', 'umar', 'w-m'),
      D.fld({ id: 'acc-cnic', label: 'شناختی کارڈ', type: 'cnic', value: a.cnic }),
      D.fld({ id: 'acc-mobile', label: 'موبائل', type: 'mob', value: a.mobile, grow: true })
    ])}
    ${D.row([
      D.fld({ id: 'acc-pesha', label: 'پیشہ', w: 'w-l', grow: true, pair: true, value: a.pesha, ph: 'مثلاً: مزدور' }),
      D.fld({ id: 'acc-arrest-disp', label: 'تاریخ گرفتاری', type: 'date', pair: true, value: a.arrest_date })
    ])}
    ${D.row([
      sel('رنگ', ACC_RANG, a.rang, 'acc-rang', 'rang', 'w-s'),
      sel('چہرہ', ACC_CHEHRA, a.chehra, 'acc-chehra', 'chehra', 'w-s'),
      sel('جسم', ACC_JISM, a.jism, 'acc-jism', 'jism', 'w-m'),
      sel('قد', ACC_QAD, a.qad, 'acc-qad', 'qad', 'w-xs', 'ltr'),
      sel('نشان', ACC_NISHAN, a.nishan, 'acc-nishan', 'nishan', 'w-m', null, 'grow')
    ])}
    ${D.uploads([
      ['acc-photos', 'تصاویر ملزم', 'ایک سے زیادہ', true, 6],
      ['acc-cnicF', 'شناختی کارڈ — سامنے', '', false, 1],
      ['acc-cnicB', 'شناختی کارڈ — پیچھے', '', false, 1]
    ])}
    ${window.DIOPrev ? DIOPrev.panel(a.prev_records) : ''}
  </div>`;

  D.open('ملزم', !!id, body, `_saveAccused('${id || ''}')`);
  if (window.DIOPrev) {
    const nameIds = document.getElementById('acc-name') ? ['acc-name'] : ['acc-name-n'];
    DIOPrev.watch({ nameIds, cnicId: 'acc-cnic', selfTable: 'case_accused', selfId: id || null, caseId: caseId || null });
  }
}





// ── SAVE ──────────────────────────────────────────────────────
async function _saveAccused(id) {
  const D = window.DIOCard;
  const name = D.readName('acc-name');
  if (!name) { showToast('ملزم کا نام لکھیں', 'error'); return; }
  const cs = D.readCase();
  const caseId = cs ? cs.id : (document.getElementById('dio-case') ? null : _accusedCaseId);   // کارڈ میں مقدمہ کا خانہ ہو تو وہی لازمی
  if (!caseId) { showToast('مقدمہ منتخب کریں', 'error'); document.getElementById('dio-case')?.focus(); return; }

  // value of a dropdown, ignoring the "+" add sentinel
  const gv = (fid) => { const v = document.getElementById(fid)?.value; return (v && v !== '__add__') ? v : null; };
  const arrestDisp = document.getElementById('acc-arrest-disp')?.value.trim() || '';
  const arrestISO = D.dmyToIso(arrestDisp);
  if (arrestDisp && !arrestISO) { showToast('تاریخ گرفتاری درست لکھیں (DD/MM/YYYY)', 'error'); return; }
  const cnic = document.getElementById('acc-cnic')?.value.trim() || '';
  if (cnic && cnic.replace(/\D/g, '').length !== 13) { showToast('شناختی کارڈ کے 13 ہندسے لکھیں', 'error'); return; }
  const photos = D.getFiles('acc-photos');

  const rec = {
    case_id: caseId,
    name,
    accused_type: document.getElementById('acc-type')?.value || _accusedFormType || 'fir',
    cnic: cnic || null,
    mobile: document.getElementById('acc-mobile')?.value.trim() || null,
    arrest_date: arrestISO || null,
    pesha: document.getElementById('acc-pesha')?.value.trim() || null,
    taleem: gv('acc-taleem'),
    rang: gv('acc-rang'),
    chehra: gv('acc-chehra'),
    jism: gv('acc-jism'),
    qad: gv('acc-qad'),
    umar: gv('acc-umar'),
    nishan: gv('acc-nishan'),
    photo_url: photos[0] || null,
    cnic_copy_url: D.getFiles('acc-cnicF')[0] || null,
    // نئے کالم (sql/101) — نہ ہوں تو ان کے بغیر محفوظ ہوگا
    photos: photos,
    cnic_back_url: D.getFiles('acc-cnicB')[0] || null,
    prev_records: window.DIOPrev ? DIOPrev.read() : [],
  };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    await D.safeWrite('case_accused', id ? 'update' : 'insert', rec, id, ['photos', 'cnic_back_url', 'prev_records']);
    closeModal();
    // اسی مقدمے کی ملزمان فہرست کھلی ہو تو تازہ کرو (Dashboard سے اندراج پر صفحہ نہ بدلے)
    if (String(caseId) === String(_accusedCaseId) && document.getElementById('acc-list')) {
      await _loadAccused();
      _renderAccusedArea();
    } else {
      try { localStorage.removeItem('dio_accused_' + caseId); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    }
    showToast('ملزم محفوظ ہو گیا' + (cs && cs.fir && String(caseId) !== String(_accusedCaseId) ? ' — مقدمہ ' + cs.fir : ''), 'success');
  } catch (e) { showToast('' + (e && e.message || e), 'error'); }
}

async function _deleteAccused(id) {
  if (!confirm('کیا آپ یہ ملزم حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('case_accused').delete().eq('id', id);
    await _loadAccused();
    _renderAccusedArea();
    showToast('حذف ہو گیا', 'info');
  } catch(e) { showToast('' + e.message, 'error'); }
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

  // تمام تصاویر + شناختی کارڈ (دونوں رخ) — دبانے پر دیکھیں / زوم / ڈاؤن لوڈ / پرنٹ / شیئر
  window._accDocs = _accDocList(a);
  const thumbs = window._accDocs.length
    ? '<div style="display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap;">' + window._accDocs.map(_accDocThumb).join('') + '</div>'
    : '';
  const prevs = (Array.isArray(a.prev_records) && a.prev_records.length && window.DIOPrev)
    ? '<div style="margin-top:10px;"><div style="font-weight:700;">سابقہ ریکارڈ</div>' +
      a.prev_records.map(r => '<div style="padding:4px 0;border-bottom:1px dashed var(--border);font-size:12pt;">' + _escA(DIOPrev.toText(r)) + '</div>').join('') + '</div>'
    : '';

  const body = `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
    ${row('نام و پتہ', a.name)}
    ${row('شناختی کارڈ', a.cnic)}
    ${row('موبائل', a.mobile)}
    ${row('پیشہ', a.pesha)}
    ${row('تعلیم', a.taleem)}
    ${row('عمر', a.umar)}
    ${row('تاریخ گرفتاری', a.arrest_date ? _fmtDateDMY(a.arrest_date) : '')}
    ${row('حلیہ', haleeya)}
    ${prevs}
    ${thumbs}
  </div>`;

  openModal('ملزم کی تفصیل', body, `
    <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
    <button class="btn btn-primary" onclick="closeModal();_openAccusedForm('${a.id}','${a.accused_type||'fir'}')">ترمیم</button>
  `);
}

// ملزم کی تمام فائلیں (پرانا ڈیٹا: صرف photo_url / cnic_copy_url)
function _accDocList(a) {
  const out = [];
  const photos = (Array.isArray(a.photos) && a.photos.length) ? a.photos : (a.photo_url ? [a.photo_url] : []);
  photos.forEach((u, i) => { if (u) out.push({ url: u, label: 'تصویر ' + (i + 1), name: 'photo_' + (i + 1) }); });
  if (a.cnic_copy_url) out.push({ url: a.cnic_copy_url, label: 'شناختی کارڈ — سامنے', name: 'cnic_front' });
  if (a.cnic_back_url) out.push({ url: a.cnic_back_url, label: 'شناختی کارڈ — پیچھے', name: 'cnic_back' });
  out.forEach(d => { d.name = ((window.DIOCard ? DIOCard.coreName(a.name) : a.name) || 'mulzim').replace(/\s+/g, '_') + '_' + d.name; });
  return out;
}
function _accDocThumb(d, i) {
  const pdf = /^data:application\/pdf/.test(d.url);
  const inner = pdf
    ? '<div onclick="_accOpenDoc(' + i + ')" style="width:96px;height:96px;border-radius:8px;cursor:pointer;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14pt;background:var(--bg-card);">PDF</div>'
    : '<img src="' + esc(d.url) + '" alt="" onclick="_accOpenDoc(' + i + ')" style="width:96px;height:96px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--border);">';
  return '<div style="text-align:center;">' + inner + '<div style="font-size:10.5pt;color:var(--text-muted);margin-top:3px;">' + _escA(d.label) + '</div></div>';
}
function _accOpenDoc(i) {
  const d = (window._accDocs || [])[i];
  if (!d) return;
  if (window.DIOCard) DIOCard.viewer(d.url, d.name, d.label);
  else _accOpenViewer(d.url, d.name, d.label);
}

// ── PHOTO / CNIC-COPY VIEWER (view • print • download) ─────────
let _accViewUrl = null;
let _accViewName = 'file';

// Independent overlay lightbox (does NOT replace whatever modal is behind it)
function _accOpenViewer(url, name, title) {
  _accViewUrl = url;
  _accViewName = name || 'file';
  const isPdf = /^data:application\/pdf/.test(url);
  const viewer = isPdf
    ? `<iframe src="${esc(url)}" style="width:80vw;height:74vh;border:none;background:#fff;border-radius:6px;"></iframe>`
    : `<img src="${esc(url)}" style="max-width:88vw;max-height:74vh;border-radius:6px;display:block;margin:0 auto;">`;
  _accCloseViewer();
  const ov = document.createElement('div');
  ov.id = 'acc-lightbox';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;';
  ov.innerHTML = `
    <div style="background:var(--bg,#fff);border-radius:10px;padding:12px;max-width:96vw;max-height:92vh;overflow:auto;direction:rtl;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
        <strong style="font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;">${title}</strong>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm" onclick="_accDownloadDoc()">ڈاؤن لوڈ</button>
          <button class="btn btn-primary btn-sm" onclick="_accPrintDoc()">پرنٹ</button>
          <button title="بند کریں" aria-label="بند کریں" class="btn btn-danger btn-sm" onclick="_accCloseViewer()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg></button>
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
    ? `<iframe src="${esc(_accViewUrl)}" style="width:100%;height:100vh;border:none;" onload="setTimeout(function(){window.focus();window.print();},400)"></iframe>`
    : `<img src="${esc(_accViewUrl)}" style="max-width:100%;" onload="setTimeout(function(){window.focus();window.print();},400)">`;
  w.document.write('<!DOCTYPE html><html><head><title>' + esc(_accViewName) + '</title></head><body style="margin:0;text-align:center;">' + content + '</body></html>');
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
      if (btn) { btn.classList.add('acc-blink'); btn.title = 'سابقہ ریکارڈ موجود ہے — چیک کریں'; }
    }
  });
}

async function _accPrevRecord(id) {
  const a = _accusedList.find(x => x.id === id);
  if (!a) return;
  if (!a.cnic && !a.name) { showToast('شناخت دستیاب نہیں', 'info'); return; }
  if (!navigator.onLine) { showToast('سابقہ ریکارڈ کے لیے انٹرنیٹ درکار ہے', 'info'); return; }
  showToast('تلاش جاری...', 'info');
  try {
    let q = supabaseClient.from('case_accused').select('*').neq('case_id', _accusedCaseId);
    if (a.cnic) q = q.eq('cnic', a.cnic); else q = q.ilike('name', a.name);
    const { data: recs } = await q;
    const list = recs || [];
    if (!list.length) {
      openModal('سابقہ ریکارڈ', `<div style="direction:rtl;text-align:center;padding:24px;color:var(--text-muted);">اس ملزم کا کسی دیگر مقدمہ میں کوئی ریکارڈ نہیں ملا۔</div>`,
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
      } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    }
    const rows = list.map(r => {
      const label = _accCaseLabel(caseMap[r.case_id], r.case_id);
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:9px 11px;margin-bottom:6px;direction:rtl;">
        <div style="font-weight:700;font-size:14px;">${_escA(label)}</div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;gap:10px;flex-wrap:wrap;margin-top:3px;">
          ${r.name?`<span>${_escA(r.name)}</span>`:''}
          ${r.cnic?`<span dir="ltr">${_escA(r.cnic)}</span>`:''}
          ${r.pesha?`<span>${_escA(r.pesha)}</span>`:''}
          ${r.arrest_date?`<span dir="ltr">${_fmtDateDMY(r.arrest_date)}</span>`:''}
        </div>
      </div>`;
    }).join('');
    openModal('سابقہ ریکارڈ (' + list.length + ')', `<div style="direction:rtl;">${rows}</div>`,
      `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
  } catch(e) { showToast('' + e.message, 'error'); }
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
