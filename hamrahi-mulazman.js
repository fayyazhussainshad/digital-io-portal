/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ہمراہی ملازمان (Accompanying Staff)
   Per-case staff list: نام / عہدہ / محکمانہ نمبر / موبائل
   ═══════════════════════════════════════════════════════════ */

let _hamCaseId = null;
let _hamList = [];

const HAM_RANKS = [
  { v:'C',         label:'C (کانسٹیبل)' },
  { v:'HC',        label:'HC (ہیڈ کانسٹیبل)' },
  { v:'ASI',       label:'ASI' },
  { v:'SI',        label:'SI' },
  { v:'Inspector', label:'Inspector' },
];

async function openHamrahiMulazman(caseId) {
  _hamCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadHamrahi();
  _renderHamrahiArea();
}

async function _loadHamrahi() {
  try {
    const { data } = await supabaseClient.from('hamrahi_mulazman').select('*')
      .eq('case_id', _hamCaseId).order('created_at', { ascending: true });
    _hamList = data || [];
    try { localStorage.setItem('dio_hamrahi_'+_hamCaseId, JSON.stringify(_hamList)); } catch(_) {}
  } catch(_) {
    try { _hamList = JSON.parse(localStorage.getItem('dio_hamrahi_'+_hamCaseId)||'[]'); } catch(_2) { _hamList = []; }
  }
}

function _renderHamrahiArea() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <div style="font-weight:700;font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;">ہمراہی ملازمان</div>
      <div style="margin-right:auto;">
        <button class="btn btn-primary btn-sm" onclick="_openHamrahiForm(null)">➕ ملازم شامل کریں</button>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;">
      ${_renderHamCards(_hamList)}
    </div>
  </div>`;
}

function _renderHamCards(list) {
  if (!list.length) {
    return `<div style="padding:40px 20px;text-align:center;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">👮</div>
      <div style="font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;">کوئی ملازم درج نہیں — ➕ سے شامل کریں</div>
    </div>`;
  }
  const b = (val) => (val && String(val).trim()) ? 'font-weight:bold;' : '';
  return list.map(h => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:7px;direction:rtl;flex-wrap:wrap;">
      <span style="${b(h.rank)}min-width:40px;">${h.rank||'—'}</span>
      <span style="${b(h.name)}flex:1;min-width:120px;font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;">${h.name||'—'}</span>
      <span style="${b(h.service_number)}direction:ltr;unicode-bidi:embed;min-width:80px;text-align:center;">${h.service_number||'—'}</span>
      <span style="${b(h.mobile)}direction:ltr;unicode-bidi:embed;min-width:110px;text-align:center;">${h.mobile||'—'}</span>
      <span style="display:flex;gap:4px;">
        <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openHamrahiForm('${h.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteHamrahi('${h.id}')">🗑️</button>
      </span>
    </div>`).join('');
}

function _openHamrahiForm(id) {
  const h = id ? (_hamList.find(x => x.id === id) || {}) : {};
  openModal(id ? '✏️ ملازم میں ترمیم' : '➕ ملازم شامل کریں', `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="display:block;margin-bottom:4px;font-size:13px;">نام</label>
        <input id="ham-name" type="text" value="${h.name||''}" placeholder="ملازم کا نام"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-size:13px;">عہدہ</label>
        <select id="ham-rank" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;">
          <option value="">— منتخب کریں —</option>
          ${HAM_RANKS.map(r => `<option value="${r.v}" ${h.rank===r.v?'selected':''}>${r.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-size:13px;">محکمانہ نمبر</label>
        <input id="ham-service" type="text" dir="ltr" value="${h.service_number||''}" placeholder="866/M"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;direction:ltr;text-align:left;">
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-size:13px;">سیل نمبر</label>
        <input id="ham-mobile" type="text" dir="ltr" value="${h.mobile||''}" placeholder="0000-0000000" oninput="_hamFmtMobile(this)"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;direction:ltr;text-align:left;">
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-size:13px;">شناختی کارڈ</label>
        <input id="ham-cnic" type="text" dir="ltr" value="${h.cnic||''}" placeholder="00000-0000000-0" oninput="_hamFmtCnic(this)"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;direction:ltr;text-align:left;">
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveHamrahi('${id||''}')">💾 محفوظ کریں</button>
  `);
}

function _hamFmtMobile(el) {
  let d = el.value.replace(/\D/g,'').slice(0,11);
  if (d.length > 4) d = d.slice(0,4) + '-' + d.slice(4);
  el.value = d;
}
function _hamFmtCnic(el) {
  let d = el.value.replace(/\D/g,'').slice(0,13);
  if (d.length > 5) d = d.slice(0,5) + '-' + d.slice(5);
  if (d.length > 13) d = d.slice(0,13) + '-' + d.slice(13);
  el.value = d;
}

async function _saveHamrahi(id) {
  const rec = {
    case_id: _hamCaseId,
    name: (document.getElementById('ham-name')||{}).value || '',
    rank: (document.getElementById('ham-rank')||{}).value || '',
    service_number: (document.getElementById('ham-service')||{}).value || '',
    mobile: (document.getElementById('ham-mobile')||{}).value || '',
    cnic: (document.getElementById('ham-cnic')||{}).value || '',
  };
  if (!rec.name.trim()) { if (typeof showToast==='function') showToast('⚠️ نام ضروری ہے','error'); return; }
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;

    const _try = async (payload) => {
      if (id) return await supabaseClient.from('hamrahi_mulazman').update(payload).eq('id', id);
      return await supabaseClient.from('hamrahi_mulazman').insert(payload);
    };
    let { error } = await _try(rec);
    // If a column is missing, drop optional columns and retry (so save still works)
    if (error && error.message && /column|schema cache/i.test(error.message)) {
      const minimal = { case_id: rec.case_id, name: rec.name, rank: rec.rank, mobile: rec.mobile };
      if (oid) minimal.officer_id = oid;
      const r2 = await _try(minimal);
      error = r2.error;
    }
    if (error) throw error;

    closeModal();
    await _loadHamrahi();
    _renderHamrahiArea();
    if (typeof showToast === 'function') showToast('✅ ملازم محفوظ ہو گیا', 'success');
  } catch(e) {
    if (typeof showToast === 'function') showToast('❌ ' + e.message, 'error');
  }
}

async function _deleteHamrahi(id) {
  if (!confirm('کیا آپ یہ ملازم حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('hamrahi_mulazman').delete().eq('id', id);
    await _loadHamrahi();
    _renderHamrahiArea();
    if (typeof showToast === 'function') showToast('🗑️ ملازم حذف ہو گیا', 'info');
  } catch(e) {
    if (typeof showToast === 'function') showToast('❌ ' + e.message, 'error');
  }
}

window.openHamrahiMulazman = openHamrahiMulazman;
window._openHamrahiForm = _openHamrahiForm;
window._saveHamrahi = _saveHamrahi;
window._deleteHamrahi = _deleteHamrahi;
window._hamFmtMobile = _hamFmtMobile;
window._hamFmtCnic = _hamFmtCnic;
