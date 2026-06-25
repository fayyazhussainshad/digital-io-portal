/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — Multi-officer case sharing (P9)
   Share a case with another officer (read or write)
   ═══════════════════════════════════════════════════════════ */

let _shareCaseId = null;

async function openCaseShareModal(caseId) {
  _shareCaseId = caseId;
  openModal('🔗 مقدمہ شیئر کریں', `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:13px;color:var(--text-secondary);">
        دوسرے افسر کو یہ مقدمہ دیکھنے یا ترمیم کی اجازت دیں
      </div>
      <div>
        <label style="font-size:13px;font-weight:600;">افسر تلاش کریں (نام یا محکمانہ نمبر):</label>
        <input id="share-officer-search" type="text" placeholder="نام یا بیج نمبر لکھیں"
          oninput="_searchOfficersForShare(this.value)"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;margin-top:4px;font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
      <div id="share-officer-results" style="max-height:200px;overflow-y:auto;"></div>
      <div id="share-current-list" style="border-top:1px solid var(--border);padding-top:10px;"></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`);
  _loadCurrentShares();
}
window.openCaseShareModal = openCaseShareModal;

let _shareSearchDebounce;
function _searchOfficersForShare(q) {
  clearTimeout(_shareSearchDebounce);
  _shareSearchDebounce = setTimeout(async () => {
    const box = document.getElementById('share-officer-results');
    if (!box) return;
    q = (q||'').trim();
    if (q.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">تلاش جاری...</div>';
    try {
      const myId = (typeof getOfficerId==='function') ? await getOfficerId() : null;
      const { data } = await supabaseClient.from('officers')
        .select('id,full_name,badge_number,designation,station')
        .or(`full_name.ilike.%${q}%,badge_number.ilike.%${q}%`)
        .limit(8);
      const list = (data||[]).filter(o => o.id !== myId);
      if (!list.length) { box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">کوئی افسر نہیں ملا</div>'; return; }
      box.innerHTML = list.map(o => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;direction:rtl;">
          <div>
            <div style="font-weight:700;font-size:14px;">${o.full_name||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${o.designation||''} · ${o.badge_number||''} · ${o.station||''}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-sm" onclick="_shareWith('${o.id}','read')">👁️ دیکھیں</button>
            <button class="btn btn-primary btn-sm" onclick="_shareWith('${o.id}','write')">✏️ ترمیم</button>
          </div>
        </div>`).join('');
    } catch(e) {
      box.innerHTML = `<div style="font-size:12px;color:var(--red);padding:8px;">${e.message}</div>`;
    }
  }, 350);
}
window._searchOfficersForShare = _searchOfficersForShare;

async function _shareWith(officerId, permission) {
  try {
    const myId = (typeof getOfficerId==='function') ? await getOfficerId() : null;
    // Avoid duplicate share
    const { data: existing } = await supabaseClient.from('case_shares')
      .select('id').eq('case_id', _shareCaseId).eq('shared_with', officerId).maybeSingle();
    if (existing) {
      await supabaseClient.from('case_shares').update({ permission }).eq('id', existing.id);
    } else {
      await supabaseClient.from('case_shares').insert({
        case_id: _shareCaseId, shared_by: myId, shared_with: officerId, permission
      });
    }
    showToast('✅ مقدمہ شیئر ہو گیا ('+(permission==='write'?'ترمیم':'صرف دیکھیں')+')', 'success');
    const sr = document.getElementById('share-officer-search'); if (sr) sr.value = '';
    const rb = document.getElementById('share-officer-results'); if (rb) rb.innerHTML = '';
    _loadCurrentShares();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}
window._shareWith = _shareWith;

async function _loadCurrentShares() {
  const box = document.getElementById('share-current-list');
  if (!box) return;
  try {
    const { data } = await supabaseClient.from('case_shares')
      .select('id,permission,shared_with,officers!case_shares_shared_with_fkey(full_name,badge_number)')
      .eq('case_id', _shareCaseId);
    if (!data || !data.length) { box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">ابھی کسی کے ساتھ شیئر نہیں</div>'; return; }
    box.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:6px;">شیئر شدہ افسران:</div>' +
      data.map(s => {
        const off = s.officers || {};
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px;direction:rtl;">
          <span style="font-size:13px;">${off.full_name||'—'} <span style="color:var(--text-muted);font-size:11px;">(${s.permission==='write'?'ترمیم':'دیکھیں'})</span></span>
          <button class="btn btn-danger btn-sm" onclick="_unshare('${s.id}')">✕</button>
        </div>`;
      }).join('');
  } catch(e) {
    box.innerHTML = `<div style="font-size:12px;color:var(--text-muted);">شیئر لسٹ دستیاب نہیں</div>`;
  }
}

async function _unshare(shareId) {
  try {
    await supabaseClient.from('case_shares').delete().eq('id', shareId);
    showToast('شیئر ہٹا دیا گیا', 'info');
    _loadCurrentShares();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}
window._unshare = _unshare;
