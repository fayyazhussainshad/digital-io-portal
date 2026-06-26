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
      try { localStorage.setItem('dio_staff_'+_stCaseId, JSON.stringify(data)); } catch(_) {}
    }
  } catch(_) {}
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
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-secondary);">
      <div style="font-weight:700;font-size:16px;">ہمراہی ملازمان</div>
      <button class="btn btn-primary btn-sm" style="margin-right:auto;" onclick="_stForm(null)">➕ ملازم شامل کریں</button>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      ${_stList.length ? _stList.map(_stCard).join('') : `
        <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <div style="font-size:42px;margin-bottom:12px;">👮</div>
          <div style="font-size:15px;">کوئی ملازم درج نہیں</div>
          <div style="font-size:13px;color:var(--text-faint);">شروع کرنے کے لیے اوپر ➕ بٹن دبائیں</div>
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
    <span style="font-size:15px;font-weight:700;">${s.name||'—'}</span>
    <span style="color:var(--text-muted);font-size:13px;" dir="ltr">${b(s.service_number)}</span>
    <span style="color:var(--text-muted);font-size:13px;" dir="ltr">${b(s.mobile)}</span>
    <span style="color:var(--text-muted);font-size:12px;" dir="ltr">${s.cnic||''}</span>
    <span style="margin-right:auto;display:flex;gap:4px;">
      <button class="btn btn-secondary btn-sm" onclick="_stForm('${s.id}')">✏️</button>
      <button class="btn btn-danger btn-sm" onclick="_stDelete('${s.id}','${(s.name||'').replace(/'/g,'')}')">🗑️</button>
    </span>
  </div>`;
}

function _stForm(id) {
  const s = id ? (_stList.find(x => x.id === id) || {}) : {};
  const inp = 'width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;';
  openModal(id ? '✏️ ملازم میں ترمیم' : '➕ ملازم شامل کریں', `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:10px;font-family:'Jameel Noori Nastaleeq',serif;">
      <div><label style="font-size:13px;">نام</label>
        <input id="st-name" type="text" value="${s.name||''}" placeholder="ملازم کا نام" style="${inp}direction:rtl;"></div>
      <div><label style="font-size:13px;">عہدہ</label>
        <select id="st-rank" style="${inp}">
          <option value="">— منتخب کریں —</option>
          ${ST_RANKS.map(r=>`<option value="${r.v}" ${s.rank===r.v?'selected':''}>${r.label}</option>`).join('')}
        </select></div>
      <div><label style="font-size:13px;">محکمانہ نمبر</label>
        <input id="st-service" type="text" dir="ltr" value="${s.service_number||''}" placeholder="866/M" style="${inp}direction:ltr;text-align:left;"></div>
      <div><label style="font-size:13px;">سیل نمبر</label>
        <input id="st-mobile" type="text" dir="ltr" value="${s.mobile||''}" placeholder="0000-0000000" style="${inp}direction:ltr;text-align:left;"></div>
      <div><label style="font-size:13px;">شناختی کارڈ</label>
        <input id="st-cnic" type="text" dir="ltr" value="${s.cnic||''}" placeholder="00000-0000000-0" style="${inp}direction:ltr;text-align:left;"></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_stSave('${id||''}')">💾 محفوظ کریں</button>
  `);
}
window._stForm = _stForm;

async function _stSave(id) {
  const g = (x) => (document.getElementById(x)||{}).value || '';
  const rec = {
    case_id: _stCaseId,
    name: g('st-name').trim(),
    rank: g('st-rank'),
    service_number: g('st-service'),
    mobile: g('st-mobile'),
    cnic: g('st-cnic'),
  };
  if (!rec.name) { showToast('⚠️ نام ضروری ہے','error'); return; }
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;

    const run = async (payload) => id
      ? supabaseClient.from('hamrahi_mulazman').update(payload).eq('id', id)
      : supabaseClient.from('hamrahi_mulazman').insert(payload);

    let { error } = await run(rec);
    // Retry without optional columns if schema is missing them
    if (error && error.message && /column|schema cache|does not exist/i.test(error.message)) {
      const minimal = { case_id: rec.case_id, name: rec.name, rank: rec.rank, mobile: rec.mobile };
      if (oid) minimal.officer_id = oid;
      error = (await run(minimal)).error;
    }
    if (error) throw error;

    closeModal();
    await _stLoad();
    _stRender();
    showToast('✅ ملازم محفوظ ہو گیا', 'success');
  } catch(e) {
    showToast('❌ محفوظ نہیں ہوا: ' + (e.message||'') + ' — SQL ٹیبل چیک کریں', 'error', 6000);
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
    await supabaseClient.from('hamrahi_mulazman').delete().eq('id', id);
    _stList = _stList.filter(x => x.id !== id);
    try { localStorage.setItem('dio_staff_'+_stCaseId, JSON.stringify(_stList)); } catch(_) {}
    _stRender();
    showToast('🗑️ ملازم حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}
