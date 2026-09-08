/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — Multi-officer case sharing  (case-sharing.js)
   Phase 2C — audit ke "Correct #2" ke mutabiq:
   • User input SANITIZED — SQL/PostgREST injection risk khatam
   • Expiry option — 1 din / 7 din / 30 din / permanent
   • Revocation (soft delete) — audit trail rahे
   • Sirf "approved" officers dikhen
   • Sirf apne station ke officers dikhen (audit: authorized staff only)
   ═══════════════════════════════════════════════════════════ */

let _shareCaseId = null;

// ── User input sanitizer — PostgREST .or() mein safe use ──────
// Wajah: pehle `.or(`full_name.ilike.%${q}%,...`)` mein user text raw
// interpolate ho raha tha. Agar q mein ',' ')' '(' '.' '%' hote to
// PostgREST filter clauses tor sakta tha — data leak ka خطرہ.
function _shareSanitize(s) {
  return String(s || '')
    .replace(/[,()%\\]/g, ' ')   // PostgREST-toxic characters
    .replace(/\.+/g, ' ')         // filter separator
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);                // rate-limit ki jagah length cap
}

async function openCaseShareModal(caseId) {
  _shareCaseId = caseId;
  openModal('🔗 مقدمہ شیئر کریں', `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:13px;color:var(--text-secondary);">
        دوسرے افسر کو یہ مقدمہ دیکھنے یا ترمیم کی اجازت دیں۔ صرف اپنے تھانے کے فعال افسران دکھائے جاتے ہیں۔
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;">افسر تلاش کریں (نام یا محکمانہ نمبر):</label>
        <input id="share-officer-search" type="text" placeholder="نام یا بیج نمبر لکھیں"
          maxlength="60"
          oninput="_searchOfficersForShare(this.value)"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;margin-top:4px;font-family:'Jameel Noori Nastaleeq',serif;">
      </div>

      <div>
        <label style="font-size:13px;font-weight:600;">مدت (کب تک):</label>
        <select id="share-duration"
          style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;margin-top:4px;font-family:'Jameel Noori Nastaleeq',serif;">
          <option value="1">1 دن</option>
          <option value="7" selected>7 دن</option>
          <option value="30">30 دن</option>
          <option value="0">مستقل (کوئی مدت نہیں)</option>
        </select>
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
    const clean = _shareSanitize(q);
    if (clean.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">تلاش جاری...</div>';
    try {
      const myId = (typeof getOfficerId==='function') ? await getOfficerId() : null;
      const myStation = (typeof currentOfficer !== 'undefined' && currentOfficer)
        ? (currentOfficer.station || '') : '';

      // Base query: apne station ke active officers
      let query = supabaseClient.from('officers')
        .select('id,full_name,badge_number,designation,station,is_approved,is_suspended')
        .or(`full_name.ilike.%${clean}%,badge_number.ilike.%${clean}%`)
        .limit(15);

      // Station-scoped (audit: "search only active, authorized staff")
      if (myStation) query = query.eq('station', myStation);

      const { data } = await query;
      // Client-side filter: khud ko, unapproved, aur suspended ko chhod do
      const list = (data || []).filter(o =>
        o.id !== myId &&
        o.is_approved !== false &&
        o.is_suspended !== true
      );
      if (!list.length) {
        box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">اپنے تھانے میں کوئی فعال افسر نہیں ملا</div>';
        return;
      }
      box.innerHTML = list.map(o => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;direction:rtl;">
          <div>
            <div style="font-weight:700;font-size:14px;">${esc(o.full_name)||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${esc(o.designation)||''} · <span dir="ltr">${esc(o.badge_number)||''}</span> · ${esc(o.station)||''}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-sm" onclick="_shareWith('${o.id}','read')" title="صرف پڑھ سکے گا">👁️ دیکھیں</button>
            <button class="btn btn-primary btn-sm" onclick="_shareWith('${o.id}','write')" title="ترمیم بھی کر سکے گا">✏️ ترمیم</button>
          </div>
        </div>`).join('');
    } catch(e) {
      box.innerHTML = `<div style="font-size:12px;color:var(--red);padding:8px;">${esc(e.message)}</div>`;
    }
  }, 350);
}
window._searchOfficersForShare = _searchOfficersForShare;

async function _shareWith(officerId, permission) {
  try {
    const myId = (typeof getOfficerId==='function') ? await getOfficerId() : null;
    const durEl = document.getElementById('share-duration');
    const days = durEl ? parseInt(durEl.value, 10) : 7;
    const expires_at = (days && days > 0)
      ? new Date(Date.now() + days*24*60*60*1000).toISOString()
      : null;

    // ═══ Duplicate active share? — pehle same officer ko active share hai to update karo ═══
    const { data: existing } = await supabaseClient.from('case_shares')
      .select('id, revoked_at')
      .eq('case_id', _shareCaseId)
      .eq('shared_with', officerId)
      .is('revoked_at', null)
      .maybeSingle();

    let shareRow = null;
    if (existing) {
      // Active share exists — permission + expiry update
      const upd = await supabaseClient.from('case_shares')
        .update({ permission, expires_at, revoked_at: null, revoked_by: null })
        .eq('id', existing.id).select().maybeSingle();
      shareRow = (upd && upd.data) || { id: existing.id };
      // AUDIT — share.updated
      try {
        if (window.DIO && DIO.audit) DIO.audit.log('share.updated', 'case_share', shareRow.id, {
          case_id: _shareCaseId,
          after: { permission, expires_at, shared_with: officerId }
        });
      } catch (_) {}
    } else {
      // Naya share
      const ins = await supabaseClient.from('case_shares').insert({
        case_id: _shareCaseId,
        shared_by: myId,
        shared_with: officerId,
        permission,
        expires_at
      }).select().maybeSingle();
      shareRow = (ins && ins.data) || null;
      // AUDIT — share.granted
      try {
        if (window.DIO && DIO.audit) DIO.audit.log('share.granted', 'case_share',
          (shareRow && shareRow.id) || null, {
          case_id: _shareCaseId,
          after: { permission, expires_at, shared_with: officerId }
        });
      } catch (_) {}
    }

    const durTxt = (days && days > 0) ? (days + ' دن کے لیے') : 'مستقل';
    const permTxt = (permission === 'write') ? 'ترمیم کی اجازت' : 'صرف دیکھنے کی اجازت';
    showToast('✅ شیئر ہو گیا — ' + permTxt + ' · ' + durTxt, 'success');

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
      .select('id,permission,shared_with,expires_at,revoked_at,starts_at,officers!case_shares_shared_with_fkey(full_name,badge_number)')
      .eq('case_id', _shareCaseId)
      .order('revoked_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (!data || !data.length) {
      box.innerHTML = '<div style="font-size:12px;color:var(--text-muted);">ابھی کسی کے ساتھ شیئر نہیں</div>';
      return;
    }

    const active  = data.filter(s => !s.revoked_at && (!s.expires_at || new Date(s.expires_at) > new Date()));
    const revoked = data.filter(s =>  s.revoked_at || (s.expires_at && new Date(s.expires_at) <= new Date()));

    const fmtDate = (v) => {
      try { return (window.DIO && DIO.date) ? DIO.date.date(v) : (v ? String(v).slice(0,10) : ''); }
      catch (_) { return v ? String(v).slice(0,10) : ''; }
    };
    const rowHtml = (s, isPast) => {
      const off = s.officers || {};
      const permTxt = s.permission === 'write' ? 'ترمیم' : 'دیکھیں';
      const exp = s.expires_at
        ? ('ختم: ' + fmtDate(s.expires_at))
        : 'مستقل';
      const badge = s.revoked_at
        ? '<span style="color:var(--red);font-size:11px;">✕ منسوخ</span>'
        : (s.expires_at && new Date(s.expires_at) <= new Date())
          ? '<span style="color:var(--text-muted);font-size:11px;">⏳ مدت ختم</span>'
          : '<span style="color:var(--green);font-size:11px;">● فعال</span>';
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;direction:rtl;
                          border:1px solid var(--border);border-radius:8px;margin-bottom:6px;
                          ${isPast?'opacity:0.55;':''}">
        <div>
          <div style="font-size:13px;font-weight:700;">${esc(off.full_name)||'—'}
            <span style="color:var(--text-muted);font-size:11px;font-weight:400;">(${permTxt})</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);">${badge} · ${exp}</div>
        </div>
        ${!isPast ? `<button class="btn btn-danger btn-sm" onclick="_unshare('${s.id}')" title="منسوخ کریں">✕</button>` : ''}
      </div>`;
    };

    box.innerHTML =
      (active.length
        ? `<div style="font-size:13px;font-weight:700;margin-bottom:6px;">✅ فعال شیئرز (${active.length}):</div>` + active.map(s => rowHtml(s, false)).join('')
        : '') +
      (revoked.length
        ? `<div style="font-size:12px;color:var(--text-muted);margin:10px 0 6px;">🗄️ گزشتہ / منسوخ (${revoked.length}):</div>` + revoked.map(s => rowHtml(s, true)).join('')
        : '');
  } catch(e) {
    box.innerHTML = `<div style="font-size:12px;color:var(--text-muted);">شیئر لسٹ دستیاب نہیں: ${esc(e.message||e)}</div>`;
  }
}

async function _unshare(shareId) {
  try {
    // AUDIT: soft delete — revoked_at set karo, record chhod do
    const myId = (typeof getOfficerId==='function') ? await getOfficerId() : null;
    const { error } = await supabaseClient.from('case_shares')
      .update({ revoked_at: new Date().toISOString(), revoked_by: myId })
      .eq('id', shareId);
    if (error) throw error;
    // AUDIT — share.revoked (Phase 4B)
    try {
      if (window.DIO && DIO.audit) DIO.audit.log('share.revoked', 'case_share', shareId, {
        case_id: _shareCaseId,
        metadata: { revoked_by: myId }
      });
    } catch (_) {}
    showToast('شیئر منسوخ کر دیا گیا — تاریخ محفوظ ہے', 'info');
    _loadCurrentShares();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}
window._unshare = _unshare;
