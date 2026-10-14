/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ہمراہی ملازمان (Accompanying Staff) — CLEAN REBUILD
   Fresh module. Table: hamrahi_mulazman
   ═══════════════════════════════════════════════════════════ */

let _stCaseId = null;
let _stList = [];

const ST_RANKS = [
  { v:'C',         label:'C (کانسٹیبل)' },
  { v:'HC',        label:'HC (ہیڈ کانسٹیبل)' },
  { v:'ASI',       label:'ASI' },
  { v:'SI',        label:'SI' },
  { v:'Inspector', label:'Inspector' },
];

async function openStaffV2(caseId) {
  _stCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null);
  const _a = _stArea();
  if (_a && window.DIO && DIO.states) _a.innerHTML = DIO.states.loading('ہمراہی ملازمان لوڈ ہو رہے ہیں');
  await _stLoad();
  _stRender();
}
window.openStaffV2 = openStaffV2;

async function _stLoad() {
  // cache-first
  try { _stList = JSON.parse(localStorage.getItem('dio_staff_'+_stCaseId)||'[]'); } catch(_) { _stList = []; }
  try {
    const { data } = await supabaseClient.from('hamrahi_mulazman').select('*')
      .eq('case_id', _stCaseId).order('created_at', { ascending: true });
    if (data) {
      _stList = data;
      try { localStorage.setItem('dio_staff_'+_stCaseId, JSON.stringify(data)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('hamrahi: local save nakaam', _); }
    }
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

function _stArea() {
  return document.getElementById('workspace-editor-area')
      || document.getElementById('workspace-tab-content')
      || document.getElementById('page-content');
}

function _stRender() {
  const area = _stArea();
  if (!area) return;
  area.innerHTML = `
  <div id="st-area" style="display:flex;flex-direction:column;height:100%;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-secondary);">
      <div class="dio-hs1" style="font-weight:700;">ہمراہی ملازمان</div>
      <button class="btn btn-primary btn-sm dio-add-btn" onclick="_stForm(null)">ملازم شامل کریں</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      ${_stList.length ? _stList.map(_stCard).join('') : `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:42px;margin-bottom:12px;"><svg viewBox='0 0 24 24' width='42' height='42' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.42;display:inline-block;vertical-align:middle'><circle cx='12' cy='9' r='3.4'/><path d='M4.5 20.5a7.5 7.5 0 0 1 15 0'/><path d='M7 6.5h10'/></svg></div>
          <div style="font-size:15px;">کوئی ملازم درج نہیں</div>
          <div style="font-size:13px;color:var(--text-faint);">شروع کرنے کے لیے اوپر <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:-3px'><path d='M12 5v14'/><path d='M5 12h14'/></svg> بٹن دبائیں</div>
        </div>`}
    </div>
  </div>`;
}

function _stCard(s) {
  const b = (v) => v ? `<b>${v}</b>` : '<span style="color:var(--text-faint);">—</span>';
  const rankLabel = (ST_RANKS.find(r=>r.v===s.rank)||{}).label || s.rank || '';
  return `
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:8px;direction:rtl;">
    <span style="background:var(--accent);color:#fff;border-radius:6px;padding:2px 8px;font-size:12px;font-weight:700;">${rankLabel||'—'}</span>
    <span style="font-size:15px;font-weight:700;">${esc(s.name)||'—'}</span>
    <span style="color:var(--text-muted);font-size:13px;" dir="ltr">${b(s.service_number)}</span>
    <span style="color:var(--text-muted);font-size:13px;" dir="ltr">${b(s.mobile)}</span>
    <span style="color:var(--text-muted);font-size:12px;" dir="ltr">${esc(s.cnic||'')}</span>
    <span style="margin-right:auto;display:flex;gap:4px;">
      <button title="ترمیم" aria-label="ترمیم" class="btn btn-secondary btn-sm" onclick="_stForm('${s.id}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg></button>
      <button title="حذف" aria-label="حذف" class="btn btn-danger btn-sm" onclick="_stDelete('${s.id}','${(s.name||'').replace(/'/g,'')}')"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
    </span>
  </div>`;
}

// «نیا اندراج — ہمراہی ملازم» — مشترکہ DIO کارڈ (اکتوبر 2026)
//   نام اور عہدہ ایک سطر میں؛ opts.caseId: Dashboard کے «نیا اندراج» سے
async function _stForm(id, opts) {
  opts = opts || {};
  const D = window.DIOCard;
  const s = id ? (_stList.find(x => x.id === id) || {}) : {};
  const caseId = s.case_id || opts.caseId || (opts.hub ? '' : _stCaseId) || '';
  const body = `
    ${await D.caseField(caseId)}
    ${D.row([
      D.fld({ id: 'st-name', label: 'نام', req: true, w: 'w-l', grow: true, value: s.name, ph: 'ملازم کا نام' }),
      D.fld({ id: 'st-rank', label: 'عہدہ', type: 'sel', w: 'w-l', value: s.rank || '',
        opts: [['', '— منتخب کریں —']].concat(ST_RANKS.map(r => [r.v, r.label])) })
    ])}
    ${D.row([
      D.fld({ id: 'st-service', label: 'محکمانہ نمبر', ltr: true, w: 'w-m', value: s.service_number, ph: '866/M' }),
      D.fld({ id: 'st-mobile', label: 'سیل نمبر', type: 'mob', value: s.mobile }),
      D.fld({ id: 'st-cnic', label: 'شناختی کارڈ', type: 'cnic', value: s.cnic, grow: true })
    ])}`;
  D.open('ہمراہی ملازم', !!id, body, `_stSave('${id || ''}')`);
}
window._stForm = _stForm;

async function _stSave(id) {
  const g = (x) => (document.getElementById(x)||{}).value || '';
  const cs = window.DIOCard ? DIOCard.readCase() : null;
  const caseId = cs ? cs.id : (document.getElementById('dio-case') ? null : _stCaseId);   // کارڈ میں مقدمہ کا خانہ ہو تو وہی لازمی
  const rec = {
    case_id: caseId,
    name: g('st-name').trim(),
    rank: g('st-rank'),
    service_number: g('st-service').trim(),
    mobile: g('st-mobile').trim(),
    cnic: g('st-cnic').trim(),
  };
  if (!rec.name) { showToast('نام ضروری ہے','error'); return; }
  if (!caseId) { showToast('مقدمہ منتخب کریں','error'); return; }
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;

    // v547: .select('id') — update میں 0 قطار (RLS/میعاد ختم) بھی ناکامی گنی جائے
    const run = async (payload) => id
      ? supabaseClient.from('hamrahi_mulazman').update(payload).eq('id', id).select('id')
      : supabaseClient.from('hamrahi_mulazman').insert(payload).select('id');

    let res = await run(rec);
    // Retry without optional columns if schema is missing them
    if (res.error && res.error.message && /column|schema cache|does not exist/i.test(res.error.message)) {
      const minimal = { case_id: rec.case_id, name: rec.name, rank: rec.rank, mobile: rec.mobile };
      if (oid) minimal.officer_id = oid;
      res = await run(minimal);
    }
    dioWriteOk(res, 'hamrahi save', true);

    closeModal();
    // اسی مقدمے کی فہرست کھلی ہو تو تازہ کرو (Dashboard سے اندراج پر صفحہ نہ بدلے)
    if (String(caseId) === String(_stCaseId) && document.getElementById('st-area')) {
      await _stLoad();
      _stRender();
    } else {
      try { localStorage.removeItem('dio_staff_' + caseId); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    }
    showToast('ملازم محفوظ ہو گیا' + (cs && cs.fir && String(caseId) !== String(_stCaseId) ? ' — مقدمہ ' + cs.fir : ''), 'success');
  } catch(e) {
    dioWriteFail('ملازم', e, 'محفوظ نہیں ہوا');
  }
}
window._stSave = _stSave;

async function _stDelete(id, name) {
  if (typeof confirmDelete === 'function') {
    confirmDelete(name || 'ملازم', async () => { await _stDoDelete(id); });
  } else {
    if (confirm('کیا آپ یہ ملازم حذف کرنا چاہتے ہیں؟')) await _stDoDelete(id);
  }
}
window._stDelete = _stDelete;

async function _stDoDelete(id) {
  try {
    // v547: نتیجہ دیکھ کر — پہلے سرور رد کرتا تب بھی «حذف ہو گیا»
    dioWriteOk(await supabaseClient.from('hamrahi_mulazman').delete().eq('id', id).select('id'), 'hamrahi delete', true);
    _stList = _stList.filter(x => x.id !== id);
    try { localStorage.setItem('dio_staff_'+_stCaseId, JSON.stringify(_stList)); } catch(_) { if (typeof dioLogError === 'function') dioLogError('hamrahi: local save nakaam', _); }
    _stRender();
    showToast('ملازم حذف ہو گیا', 'info');
  } catch(e) { dioWriteFail('ملازم', e, 'حذف نہیں ہوا'); }
}
