/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ADMIN PANEL  (admin.js)
   Multi-officer · Station management · Approvals · Reports
   Roles: superadmin > admin (SHO) > officer
   ═══════════════════════════════════════════════════════════ */

registerPage('admin', renderAdmin);

// ── MAIN RENDER ───────────────────────────────────────────────
async function renderAdmin(container) {
  const o = currentOfficer || {};
  const role = o.role || 'officer';

  if (!['admin','superadmin'].includes(role)) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;text-align:center;color:var(--text-muted);">
        <div style="font-size:64px;margin-bottom:16px;">🔒</div>
        <div style="font-size:18px;font-weight:700;color:var(--text-primary);">رسائی نہیں</div>
        <div style="font-size:13px;margin-top:8px;">یہ صفحہ صرف Admin اور SHO کے لیے ہے</div>
      </div>`;
    return;
  }

  container.innerHTML = `
  <div style="max-width:1000px;margin:0 auto;" id="admin-root">
    <div style="margin-bottom:10px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:20px;font-weight:700;cursor:pointer;color:var(--accent);line-height:1;">←</button></div>
    <div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ Loading...</div>
  </div>`;
  await _buildAdmin(role);
}

async function _buildAdmin(role) {
  const root = document.getElementById('admin-root');
  if (!root) return;

  // Load all data in parallel
  const [officers, pending, cases, activity] = await Promise.all([
    _adminGetOfficers(),
    _adminGetPending(),
    _adminGetAllCases(),
    _adminGetActivity(),
  ]);

  const active    = officers.filter(o => o.is_approved && !o.suspended);
  const suspended = officers.filter(o => o.suspended);
  const total_cases = cases.length;
  const active_cases = cases.filter(c => c.status === 'under').length;

  root.innerHTML = `
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a3a5c,#0d2a45);border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
    <div style="font-size:40px;">👮</div>
    <div>
      <div style="font-size:18px;font-weight:800;color:#fff;">Admin Panel</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.6);">
        ${role === 'superadmin' ? '👑 Super Admin' : '🏛️ SHO / Station Admin'} — ${currentOfficer?.station || ''} · ${currentOfficer?.district || ''}
      </div>
    </div>
    <div style="margin-inline-start:auto;">
      <button class="btn btn-secondary btn-sm" onclick="_adminRefresh()">🔄 Refresh</button>
    </div>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;direction:rtl;margin-bottom:16px;">
    ${[
      ['کل افسران', officers.length, '👮', 'var(--accent)'],
      ['فعال افسران', active.length, '✅', 'var(--green)'],
      ['زیر التواء', pending.length, '⏳', 'var(--amber)'],
      ['کل مقدمات', total_cases, '📁', '#a78bfa'],
    ].map(([l,v,i,c]) => `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;">${i}</div>
        <div style="font-size:26px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:11px;color:var(--text-muted);">${l}</div>
      </div>`).join('')}
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:6px;direction:rtl;margin-bottom:14px;flex-wrap:wrap;">
    ${[
      ['pending','⏳ زیر التواء درخواستیں', pending.length],
      ['officers','👮 افسران', officers.length],
      ['cases','📁 تمام مقدمات', total_cases],
      ['activity','📋 سرگرمی لاگ', ''],
      ['usage','📊 استعمال', ''],
      ['reports','📊 رپورٹ', ''],
      ['subscriptions','💳 سبسکرپشن', ''],
    ].map(([k,l,b],i) => `
      <button id="atab-${k}" onclick="_adminTab('${k}')"
        class="btn ${i===0?'btn-primary':'btn-secondary'}"
        style="font-size:12px;">
        ${l}${b!==''?` <span style="background:rgba(255,255,255,0.2);border-radius:10px;padding:1px 6px;font-size:10px;margin-right:4px;">${b}</span>`:''}
      </button>`).join('')}
  </div>

  <!-- Tab Content -->
  <div id="admin-tab-content"></div>`;

  // Store data globally for tab switching
  window._adminData = { officers, pending, cases, activity, role };

  // Show default tab
  _adminTab('pending');
}

// ── TABS ──────────────────────────────────────────────────────
function _adminTab(tab) {
  document.querySelectorAll('[id^="atab-"]').forEach(b => {
    b.className = 'btn btn-secondary';
    b.style.fontSize = '12px';
  });
  const active = document.getElementById('atab-' + tab);
  if (active) { active.className = 'btn btn-primary'; active.style.fontSize = '12px'; }

  const { officers, pending, cases, activity, role } = window._adminData || {};
  const el = document.getElementById('admin-tab-content');
  if (!el) return;

  switch(tab) {
    case 'pending':  el.innerHTML = _renderPendingTab(pending); break;
    case 'officers': el.innerHTML = _renderOfficersTab(officers, role); break;
    case 'cases':    el.innerHTML = _renderAllCasesTab(cases); break;
    case 'activity': el.innerHTML = _renderActivityTab(activity); break;
    case 'usage':    _renderUsageTab(el); break;
    case 'reports':  el.innerHTML = _renderReportsTab(officers, cases); break;
    case 'subscriptions': _renderSubsTab(); break;
  }
}

// ── PENDING APPROVALS ─────────────────────────────────────────
function _renderPendingTab(pending) {
  if (!pending.length) return `
    <div class="card" style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      <div style="font-weight:600;">کوئی زیر التواء درخواست نہیں</div>
    </div>`;

  return `<div class="card">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;">⏳ نئے افسران کی درخواستیں (${pending.length})</div>
    ${pending.map(p => `
    <div id="pending-card-${p.id}" style="background:var(--bg-secondary);border:1px solid var(--amber);border-radius:10px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--amber);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;flex-shrink:0;">
          ${(p.full_name||'?')[0].toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;">${p.full_name||'—'}</div>
          <div style="font-size:12px;color:var(--text-muted);">
            📧 ${p.email||'—'} &nbsp;·&nbsp; 🏷️ ${p.badge_number||'—'}
          </div>
          <div style="font-size:12px;color:var(--text-secondary);">
            🏛️ ${p.station||'—'} · ${p.district||'—'} &nbsp;·&nbsp; 👮 ${p.designation||'—'}
          </div>
          ${p.cnic ? `<div style="font-size:12px;color:var(--text-secondary);" dir="ltr">🆔 ${p.cnic}</div>` : ''}
          <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">
            درخواست: ${formatDate(p.created_at)}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="_adminApprove('${p.id}','${p.full_name||''}')">✅ منظور</button>
          <button class="btn btn-danger btn-sm" onclick="_adminRejectReg('${p.id}','${p.full_name||''}')">❌ رد</button>
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

// ── OFFICERS LIST ─────────────────────────────────────────────
function _renderOfficersTab(officers, role) {
  return `<div class="card" style="padding:0;overflow:hidden;">
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:13px;font-weight:700;color:var(--accent);">👮 افسران (${officers.length})</div>
      ${role==='superadmin'?`<button class="btn btn-primary btn-sm" onclick="_adminAddOfficer()">+ افسر شامل کریں</button>`:''}
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr>
        <th>نام</th><th>Badge</th><th>عہدہ</th><th>تھانہ</th><th>Role</th>
        <th>Status</th><th>Cases</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${officers.map(o => {
          const cases = (window._adminData?.cases||[]).filter(c=>c.officer_id===o.id).length;
          return `<tr style="${o.suspended?'opacity:0.6;':''}">
            <td>
              <div style="font-weight:700;">${o.full_name||'—'}</div>
              <div style="font-size:10px;color:var(--text-muted);">${o.email||''}</div>
            </td>
            <td style="font-family:monospace;font-size:11px;">${o.badge_number||'—'}</td>
            <td style="font-size:12px;">${o.designation||'—'}</td>
            <td style="font-size:12px;">${o.station||'—'}</td>
            <td>
              <select onchange="_adminChangeRole('${o.id}',this.value)"
                style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:4px;padding:3px 6px;color:var(--text-primary);font-size:11px;">
                ${['officer','admin','superadmin'].map(r=>
                  `<option value="${r}" ${o.role===r?'selected':''}>${r}</option>`
                ).join('')}
              </select>
            </td>
            <td>
              ${o.suspended
                ? `<span class="pill pill-red">معطل</span>`
                : o.is_approved
                  ? `<span class="pill pill-green">فعال</span>`
                  : `<span class="pill pill-amber">زیر التواء</span>`}
            </td>
            <td style="text-align:center;font-weight:700;color:var(--accent);">${cases}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-secondary btn-sm" onclick="_adminViewOfficer('${o.id}')">👁️</button>
              <button class="btn btn-secondary btn-sm" onclick="_adminEditOfficer('${o.id}')" title="معلومات ترمیم کریں">✏️</button>
              ${o.suspended
                ? `<button class="btn btn-primary btn-sm" onclick="_adminUnsuspend('${o.id}','${o.full_name||''}')">✅</button>`
                : `<button class="btn btn-danger btn-sm" onclick="_adminSuspend('${o.id}','${o.full_name||''}')">🚫</button>`}
              ${!o.is_approved
                ? `<button class="btn btn-primary btn-sm" onclick="_adminApproveOfficer('${o.id}')">✅ منظور</button>`:''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
  </div>`;
}

// ── ALL CASES ─────────────────────────────────────────────────
function _renderAllCasesTab(cases) {
  return `<div class="card" style="padding:0;overflow:hidden;">
    <div style="padding:14px 16px;border-bottom:1px solid var(--border);">
      <div style="font-size:13px;font-weight:700;color:var(--accent);">📁 تمام مقدمات (${cases.length})</div>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;min-width:700px;">
      <thead><tr>
        <th>مقدمہ نمبر</th><th>مدعی</th><th>دفعہ</th><th>افسر</th><th>تھانہ</th><th>Status</th><th>تاریخ</th>
      </tr></thead>
      <tbody>
        ${cases.length ? cases.map(c => {
          const officer = (window._adminData?.officers||[]).find(o=>o.id===c.officer_id);
          return `<tr>
            <td style="font-weight:800;color:var(--accent);">${c.fir_number||'—'}</td>
            <td style="font-size:12px;">${c.complainant||'—'}</td>
            <td style="font-size:11px;">${c.section_of_law||'—'}</td>
            <td style="font-size:12px;">${officer?.full_name||'—'}</td>
            <td style="font-size:11px;">${officer?.station||'—'}</td>
            <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
            <td style="font-size:11px;">${formatDate(c.fir_date)}</td>
          </tr>`;
        }).join('') : `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">کوئی مقدمہ نہیں</td></tr>`}
      </tbody>
    </table>
    </div>
  </div>`;
}

// ── ACTIVITY LOG ──────────────────────────────────────────────
function _renderActivityTab(activity) {
  return `<div class="card">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;">📋 حالیہ سرگرمی</div>
    ${activity.length ? activity.map(a => {
      const officer = (window._adminData?.officers||[]).find(o=>o.id===a.officer_id);
      return `<div style="display:flex;gap:10px;direction:rtl;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
        <span style="font-size:16px;">📋</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:600;">${officer?.full_name||'—'}</div>
          <div style="font-size:12px;">${a.action||'—'}</div>
        </div>
        <span style="font-size:10px;color:var(--text-faint);">${formatDate(a.created_at)}</span>
      </div>`;
    }).join('') : `<div style="text-align:center;padding:20px;color:var(--text-muted);">کوئی سرگرمی نہیں</div>`}
  </div>`;
}

// ── REPORTS ───────────────────────────────────────────────────
function _renderReportsTab(officers, cases) {
  const statusCounts = {};
  cases.forEach(c => { statusCounts[c.status]=(statusCounts[c.status]||0)+1; });

  // Per-officer stats
  const officerStats = officers.map(o => ({
    ...o,
    total: cases.filter(c=>c.officer_id===o.id).length,
    active: cases.filter(c=>c.officer_id===o.id&&c.status==='under').length,
    complete: cases.filter(c=>c.officer_id===o.id&&c.status==='complete').length,
  })).sort((a,b)=>b.total-a.total);

  return `
  <!-- Summary cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;direction:rtl;margin-bottom:14px;">
    ${Object.entries(STATUS_LABELS).map(([k,l])=>`
      <div class="card" style="text-align:center;padding:12px;">
        <div style="font-size:22px;font-weight:900;color:${
          k==='under'?'var(--accent)':k==='complete'?'var(--green)':k==='cancel'?'var(--red)':'var(--amber)'
        };">${statusCounts[k]||0}</div>
        <div style="font-size:11px;color:var(--text-muted);">${l}</div>
      </div>`).join('')}
  </div>

  <!-- Per officer table -->
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
      <div style="font-size:13px;font-weight:700;color:var(--accent);">📊 افسر وار کارکردگی</div>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>افسر</th><th>تھانہ</th><th>کل</th><th>زیر تفتیش</th><th>مکمل</th><th>%</th></tr></thead>
      <tbody>
        ${officerStats.map(o=>`<tr>
          <td style="font-weight:700;">${o.full_name||'—'}</td>
          <td style="font-size:12px;">${o.station||'—'}</td>
          <td style="font-weight:700;color:var(--accent);">${o.total}</td>
          <td>${o.active}</td>
          <td style="color:var(--green);">${o.complete}</td>
          <td>
            <div style="background:var(--bg-tertiary);border-radius:4px;overflow:hidden;width:60px;height:10px;display:inline-block;vertical-align:middle;">
              <div style="background:var(--green);height:100%;width:${o.total?Math.round(o.complete/o.total*100):0}%;"></div>
            </div>
            <span style="font-size:10px;margin-right:4px;">${o.total?Math.round(o.complete/o.total*100):0}%</span>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>

  <!-- Print report -->
  <div style="text-align:left;margin-top:12px;">
    <button class="btn btn-primary" onclick="_adminPrintReport()">🖨️ رپورٹ پرنٹ کریں</button>
  </div>`;
}

// ── DATA FETCHERS ─────────────────────────────────────────────
async function _adminGetOfficers() {
  const { data } = await supabaseClient.from('officers').select('*').order('full_name');
  return data || [];
}
async function _adminGetPending() {
  // Pending = officers registered but NOT yet approved. Strictly exclude approved.
  const { data } = await supabaseClient.from('officers')
    .select('*').or('is_approved.is.null,is_approved.eq.false').order('created_at', { ascending: false });
  // Extra safety: filter out any approved record that slipped through
  return (data || []).filter(o => o.is_approved !== true);
}
async function _adminGetAllCases() {
  const { data } = await supabaseClient.from('cases').select('*').order('created_at', { ascending: false });
  return data || [];
}
async function _adminGetActivity() {
  const { data } = await supabaseClient.from('station_activity')
    .select('*').order('created_at', { ascending: false }).limit(50);
  return data || [];
}

// ── ACTIONS ───────────────────────────────────────────────────
async function _adminApprove(regId, name) {
  openModal('✅ درخواست منظور کریں',
    `<p style="color:var(--text-secondary);">کیا آپ <b style="color:var(--green);">${name}</b> کی درخواست منظور کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="closeModal();_doApproveReg('${regId}')">✅ منظور</button>`
  );
}

async function _doApproveReg(regId) {
  try {
    await supabaseClient.from('officers').update({ is_approved: true }).eq('id', regId);
    // Remove card from DOM immediately (no wait for reload)
    const card = document.getElementById('pending-card-'+regId);
    if (card) card.remove();
    showToast('✅ درخواست منظور ہو گئی — افسر اب لاگ ان کر سکتا ہے', 'success');
    _adminRefresh();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _adminRejectReg(regId, name) {
  openModal('❌ درخواست رد کریں',
    `<p style="color:var(--red);">کیا آپ <b>${name}</b> کی درخواست رد کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_doRejectReg('${regId}')">❌ رد کریں</button>`
  );
}

async function _doRejectReg(regId) {
  // Remove the officer record (and clear any audit_log refs first)
  try {
    await supabaseClient.from('audit_log').delete().eq('officer_id', regId);
  } catch(_) {}
  await supabaseClient.from('officers').delete().eq('id', regId);
  // Remove card from DOM immediately
  const card = document.getElementById('pending-card-'+regId);
  if (card) card.remove();
  showToast('❌ درخواست رد کر دی گئی', 'info');
  _adminRefresh();
}

async function _adminApproveOfficer(officerId) {
  await supabaseClient.from('officers').update({ is_approved: true }).eq('id', officerId);
  showToast('✅ افسر منظور', 'success');
  _adminRefresh();
}

async function _adminSuspend(officerId, name) {
  openModal('🚫 افسر معطل کریں',
    `<div>
      <p style="color:var(--red);">کیا آپ <b>${name}</b> کو معطل کرنا چاہتے ہیں؟</p>
      <label class="form-label" style="margin-top:10px;">وجہ (ضروری)</label>
      <textarea class="form-input" id="suspend-reason" rows="3" placeholder="معطلی کی وجہ لکھیں..."></textarea>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_doSuspend('${officerId}')">🚫 معطل کریں</button>`
  );
}

async function _doSuspend(officerId) {
  const reason = document.getElementById('suspend-reason')?.value || '';
  await supabaseClient.from('officers').update({ suspended: true, suspension_reason: reason }).eq('id', officerId);
  showToast('🚫 افسر معطل کر دیا گیا', 'info');
  _adminRefresh();
}

async function _adminUnsuspend(officerId, name) {
  openModal('✅ معطلی ختم کریں',
    `<p>کیا آپ <b style="color:var(--green);">${name}</b> کی معطلی ختم کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="closeModal();_doUnsuspend('${officerId}')">✅ بحال کریں</button>`
  );
}

async function _doUnsuspend(officerId) {
  await supabaseClient.from('officers').update({ suspended: false, suspension_reason: null }).eq('id', officerId);
  showToast('✅ افسر بحال', 'success');
  _adminRefresh();
}

async function _adminChangeRole(officerId, newRole) {
  try {
    await supabaseClient.from('officers').update({ role: newRole }).eq('id', officerId);
    showToast(`✅ Role تبدیل: ${newRole}`, 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── USAGE ANALYTICS TAB ───────────────────────────────────────
const _PAGE_NAMES = {
  dashboard:'ڈیش بورڈ', cases:'میرے مقدمات', forms:'ٹیمپلیٹس', fivec:'5-C درخواستیں',
  incident:'واقعاتی رپورٹ',
  reminders:'یاددہانیاں', search:'تلاش', suspects:'ملزمان/گواہان', performance:'کارکردگی',
  backup:'بیک اپ', settings:'ترتیبات', bin:'حذف شدہ', subscription:'سبسکرپشن',
  court:'عدالتی پیشیاں', evidence:'شہادتیں', admin:'ایڈمن',
};

async function _renderUsageTab(el) {
  el.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>`;
  try {
    // Aggregate usage across all officers
    const { data } = await supabaseClient.from('usage_stats').select('page,count');
    const totals = {};
    (data||[]).forEach(r => { totals[r.page] = (totals[r.page]||0) + (r.count||0); });
    const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
    const max = sorted.length ? sorted[0][1] : 1;
    const grandTotal = sorted.reduce((s,[,v])=>s+v,0);

    if (!sorted.length) {
      el.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:10px;">📊</div>
        <div>ابھی استعمال کا ڈیٹا جمع نہیں ہوا</div>
        <div style="font-size:11px;margin-top:6px;">جیسے جیسے افسران ایپ استعمال کریں گے، یہاں ظاہر ہوگا</div>
      </div>`;
      return;
    }

    el.innerHTML = `
    <div class="card" style="direction:rtl;">
      <div style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:4px;">📊 سب سے زیادہ استعمال ہونے والے صفحات</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px;">کل ${grandTotal} مرتبہ · سب سے اوپر والے کو نمایاں کریں تاکہ افسران کو آسانی ہو</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${sorted.map(([page,count],i)=>{
          const pct = Math.round(count/max*100);
          const share = Math.round(count/grandTotal*100);
          const name = _PAGE_NAMES[page] || page;
          const rank = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`;
          return `
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:28px;text-align:center;font-size:${i<3?'16px':'12px'};font-weight:700;color:${i<3?'var(--accent)':'var(--text-muted)'};">${rank}</div>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                <span style="font-size:13px;font-weight:${i<3?'700':'500'};font-family:'Jameel Noori Nastaleeq',serif;">${name}</span>
                <span style="font-size:11px;color:var(--text-muted);">${count} (${share}%)</span>
              </div>
              <div style="background:var(--bg-tertiary);border-radius:6px;overflow:hidden;height:14px;">
                <div style="background:${i===0?'var(--accent)':i<3?'rgba(56,189,248,0.6)':'rgba(56,189,248,0.3)'};height:100%;width:${pct}%;transition:width 0.4s;"></div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:16px;padding:10px;background:var(--bg-secondary);border-radius:8px;font-size:11px;color:var(--text-muted);">
        💡 تجویز: سب سے اوپر والے 3 صفحات کو ڈیش بورڈ یا Quick Actions میں نمایاں رکھیں تاکہ افسران کو آسانی ہو۔
      </div>
    </div>`;
  } catch(e) {
    el.innerHTML = `<div class="card" style="padding:20px;color:var(--red);">❌ ${e.message}</div>`;
  }
}

// ── ADMIN: EDIT OFFICER INFO ──────────────────────────────────
async function _adminEditOfficer(officerId) {
  const o = (window._adminData?.officers||[]).find(x => x.id === officerId);
  if (!o) { showToast('❌ افسر نہیں ملا', 'error'); return; }

  openModal('✏️ افسر کی معلومات ترمیم کریں', `
    <div style="display:flex;flex-direction:column;gap:12px;direction:rtl;">
      <div>
        <label class="form-label">پورا نام</label>
        <input class="form-input" id="aeo-name" value="${(o.full_name||'').replace(/"/g,'&quot;')}" placeholder="نام">
      </div>
      <div>
        <label class="form-label">بیج نمبر (Badge)</label>
        <input class="form-input" id="aeo-badge" dir="ltr" value="${(o.badge_number||'').replace(/"/g,'&quot;')}" placeholder="Badge">
      </div>
      <div>
        <label class="form-label">عہدہ (Designation)</label>
        <input class="form-input" id="aeo-desig" value="${(o.designation||'').replace(/"/g,'&quot;')}" placeholder="مثلاً ASI، SI">
      </div>
      <div>
        <label class="form-label">تھانہ</label>
        <input class="form-input" id="aeo-station" value="${(o.station||'').replace(/"/g,'&quot;')}" placeholder="تھانہ">
      </div>
      <div>
        <label class="form-label">ضلع</label>
        <input class="form-input" id="aeo-district" value="${(o.district||'').replace(/"/g,'&quot;')}" placeholder="ضلع">
      </div>
      <div>
        <label class="form-label">فون نمبر</label>
        <input class="form-input" id="aeo-phone" dir="ltr" value="${(o.phone||'').replace(/"/g,'&quot;')}" placeholder="0XXX-XXXXXXX">
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_adminSaveOfficer('${officerId}')">💾 محفوظ کریں</button>
  `);
}

async function _adminSaveOfficer(officerId) {
  const updates = {
    full_name:    document.getElementById('aeo-name')?.value.trim() || null,
    badge_number: document.getElementById('aeo-badge')?.value.trim() || null,
    designation:  document.getElementById('aeo-desig')?.value.trim() || null,
    station:      document.getElementById('aeo-station')?.value.trim() || null,
    district:     document.getElementById('aeo-district')?.value.trim() || null,
    phone:        document.getElementById('aeo-phone')?.value.trim() || null,
  };
  try {
    const { error } = await supabaseClient.from('officers').update(updates).eq('id', officerId);
    if (error) throw error;
    closeModal();
    showToast('✅ افسر کی معلومات اپ ڈیٹ ہو گئیں', 'success');
    showPage('admin', document.querySelector('.nav-item.active'));
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _adminViewOfficer(officerId) {
  const o = (window._adminData?.officers||[]).find(x=>x.id===officerId);
  if (!o) return;
  const cases = (window._adminData?.cases||[]).filter(c=>c.officer_id===officerId);
  openModal(`👮 ${o.full_name||'—'}`,
    `<div style="font-size:13px;line-height:2.2;">
      <div>📧 <b>Email:</b> ${o.email||'—'}</div>
      <div>🏷️ <b>Badge:</b> ${o.badge_number||'—'}</div>
      <div>👮 <b>عہدہ:</b> ${o.designation||'—'}</div>
      <div>🏛️ <b>تھانہ:</b> ${o.station||'—'} · ${o.district||'—'}</div>
      <div>🔑 <b>Role:</b> ${o.role||'officer'}</div>
      <div>📊 <b>Status:</b> ${o.suspended?'<span style="color:var(--red);">معطل</span>':o.is_approved?'<span style="color:var(--green);">فعال</span>':'زیر التواء'}</div>
      <div>📁 <b>کل مقدمات:</b> ${cases.length}</div>
      ${o.suspension_reason?`<div>📝 <b>معطلی وجہ:</b> ${o.suspension_reason}</div>`:''}
    </div>`,
    `<button class="btn btn-primary" onclick="closeModal()">بند کریں</button>`
  );
}

function _adminAddOfficer() {
  openModal('+ نیا افسر شامل کریں',
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;direction:rtl;">
      <div><label class="form-label">مکمل نام *</label><input class="form-input" id="ao-name" placeholder="نام"></div>
      <div><label class="form-label">Email *</label><input class="form-input" id="ao-email" placeholder="email@police.gov.pk" type="email"></div>
      <div><label class="form-label">Badge Number</label><input class="form-input" id="ao-badge" placeholder="Badge No"></div>
      <div><label class="form-label">عہدہ</label><input class="form-input" id="ao-desig" placeholder="ASI/SI/Inspector"></div>
      <div><label class="form-label">تھانہ</label><input class="form-input" id="ao-station" value="${currentOfficer?.station||''}"></div>
      <div><label class="form-label">ضلع</label><input class="form-input" id="ao-district" value="${currentOfficer?.district||''}"></div>
      <div><label class="form-label">Role</label>
        <select class="form-input" id="ao-role">
          <option value="officer">Officer</option>
          <option value="admin">Admin (SHO)</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>
      <div><label class="form-label">عارضی پاسورڈ *</label><input class="form-input" id="ao-pass" type="password" placeholder="Min 8 characters"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="_doAddOfficer()">+ شامل کریں</button>`
  );
}

async function _doAddOfficer() {
  const name    = document.getElementById('ao-name')?.value.trim();
  const email   = document.getElementById('ao-email')?.value.trim();
  const badge   = document.getElementById('ao-badge')?.value.trim();
  const desig   = document.getElementById('ao-desig')?.value.trim();
  const station = document.getElementById('ao-station')?.value.trim();
  const district= document.getElementById('ao-district')?.value.trim();
  const role    = document.getElementById('ao-role')?.value;
  const pass    = document.getElementById('ao-pass')?.value;

  if (!name||!email||!pass) { showToast('⚠️ نام، Email اور پاسورڈ ضروری ہے','error'); return; }
  if (pass.length < 8) { showToast('⚠️ پاسورڈ کم از کم 8 حروف','error'); return; }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email, password: pass,
      options: { data: { full_name: name, badge_number: badge, station, district } }
    });
    if (error) throw error;
    if (data.user) {
      await supabaseClient.from('officers').insert({
        user_id: data.user.id, full_name: name, email,
        badge_number: badge, designation: desig,
        station, district, role, is_approved: true
      });
    }
    closeModal();
    showToast('✅ افسر شامل ہو گیا', 'success');
    _adminRefresh();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _adminRefresh() {
  const c = document.getElementById('page-content');
  if (c) renderAdmin(c);
}

// ── PRINT REPORT ──────────────────────────────────────────────
function _adminPrintReport() {
  const { officers, cases } = window._adminData || {};
  const date = formatDate(new Date());
  const o = currentOfficer || {};
  let html = `<h2 style="text-align:center;"><br>تھانہ ${o.station||'—'} ضلع ${o.district||'—'}</h2>`;
  html += `<p style="text-align:center;">تاریخ: ${date}</p><hr>`;
  html += `<h3>افسر وار رپورٹ</h3><table border="1" style="width:100%;border-collapse:collapse;">`;
  html += `<tr><th>افسر</th><th>عہدہ</th><th>کل</th><th>زیر تفتیش</th><th>مکمل</th></tr>`;
  (officers||[]).forEach(of => {
    const t = (cases||[]).filter(c=>c.officer_id===of.id).length;
    const a = (cases||[]).filter(c=>c.officer_id===of.id&&c.status==='under').length;
    const cp = (cases||[]).filter(c=>c.officer_id===of.id&&c.status==='complete').length;
    html += `<tr><td>${of.full_name||'—'}</td><td>${of.designation||'—'}</td><td>${t}</td><td>${a}</td><td>${cp}</td></tr>`;
  });
  html += `</table>`;
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;direction:rtl;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;}</style></head><body>${html}</body></html>`);
  dioPrint(_printHTML);
  
}

// ── LOG ACTIVITY HELPER (call from other modules) ─────────────
async function logActivity(action, details) {
  try {
    const oid = await getOfficerId();
    if (!oid) return;
    await supabaseClient.from('station_activity').insert({
      officer_id: oid, action, details: details || {}
    });
  } catch(_) {}
}

// ── SUBSCRIPTION MANAGEMENT ───────────────────────────────────
async function _renderSubsTab() {
  const el = document.getElementById('admin-tab-content');
  if (!el) return;
  el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>';

  try {
    const { data } = await supabaseClient
      .from('subscriptions')
      .select('*, officers(full_name,station,designation), subscription_plans(name,price)')
      .order('created_at', { ascending: false })
      .limit(50);

    const subs = data || [];
    const pending  = subs.filter(s=>s.status==='pending');
    const active   = subs.filter(s=>s.status==='active');
    const trial    = subs.filter(s=>s.status==='trial');
    const expired  = subs.filter(s=>s.status==='expired');

    el.innerHTML = `
    <!-- Summary -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
      ${[
        ['⏳ زیر التواء', pending.length, 'var(--amber)'],
        ['✅ فعال', active.length, 'var(--green)'],
        ['🎁 آزمائشی', trial.length, 'var(--accent)'],
        ['❌ ختم', expired.length, 'var(--red)'],
      ].map(([l,v,c])=>`
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:9px;color:var(--text-muted);">${l}</div>
        <div style="font-size:24px;font-weight:900;color:${c};">${v}</div>
      </div>`).join('')}
    </div>

    <!-- Pending approvals -->
    ${pending.length ? `
    <div class="card" style="margin-bottom:12px;border:1px solid var(--amber);">
      <div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:10px;">⏳ زیر التواء تصدیق (${pending.length})</div>
      ${pending.map(s=>`
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:8px;direction:rtl;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:700;">${s.officers?.full_name||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${s.officers?.station||'—'} · ${s.officers?.designation||'—'}</div>
            <div style="font-size:11px;color:var(--accent);">پلان: ${s.subscription_plans?.name||'—'} · Rs. ${s.amount||0}</div>
            <div style="font-size:11px;color:var(--text-muted);">TXN: <b>${s.payment_ref||'—'}</b> · ${s.payment_method||'—'}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" onclick="_approveSub('${s.id}','${s.officer_id}')">✅ منظور</button>
            <button class="btn btn-danger btn-sm" onclick="_rejectSub('${s.id}')">❌ رد</button>
          </div>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <!-- All subscriptions table -->
    <div class="card" style="padding:0;overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--accent);">
        💳 تمام سبسکرپشن (${subs.length})
      </div>
      <div style="overflow-x:auto;">
      <table class="data-table" style="width:100%;">
        <thead><tr>
          <th>افسر</th><th>پلان</th><th>رقم</th><th>صورتحال</th>
          <th>میعاد ختم</th><th>TXN</th><th>اقدامات</th>
        </tr></thead>
        <tbody>
          ${subs.map(s=>{
            const exp = new Date(s.expires_at);
            const diff = Math.ceil((exp-new Date())/(1000*60*60*24));
            const statusColors = {active:'var(--green)',trial:'var(--accent)',pending:'var(--amber)',expired:'var(--red)',suspended:'var(--red)'};
            return `<tr>
              <td style="direction:rtl;">
                <div style="font-weight:700;">${s.officers?.full_name||'—'}</div>
                <div style="font-size:10px;color:var(--text-muted);">${s.officers?.station||'—'}</div>
              </td>
              <td style="font-size:12px;">${s.subscription_plans?.name||'—'}</td>
              <td style="font-weight:700;">Rs. ${s.amount||0}</td>
              <td><span class="pill" style="background:${statusColors[s.status]||'var(--accent)'};color:#fff;font-size:10px;">${s.status}</span></td>
              <td style="font-size:11px;color:${diff<7?'var(--red)':'var(--text-secondary)'};">${formatDate(s.expires_at)} ${diff>0?'('+diff+'d)':''}</td>
              <td style="font-size:10px;font-family:monospace;">${s.payment_ref||'—'}</td>
              <td>
                ${s.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="_approveSub('${s.id}','${s.officer_id}')">✅</button>`:''}
                ${s.status==='active'?`<button class="btn btn-danger btn-sm" onclick="_suspendSub('${s.id}')">🔒</button>`:''}
                ${s.status==='suspended'||s.status==='expired'?`<button class="btn btn-primary btn-sm" onclick="_approveSub('${s.id}','${s.officer_id}')">🔓</button>`:''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      </div>
    </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">❌ ${e.message}</div>`;
  }
}

async function _approveSub(subId, officerId) {
  try {
    const { data:sub } = await supabaseClient.from('subscriptions').select('*,subscription_plans(duration_days)').eq('id',subId).single();
    const days = sub?.subscription_plans?.duration_days || 30;
    const exp  = new Date();
    exp.setDate(exp.getDate() + days);

    await supabaseClient.from('subscriptions').update({
      status:      'active',
      verified_by: await getOfficerId(),
      verified_at: new Date().toISOString(),
      expires_at:  exp.toISOString(),
    }).eq('id', subId);

    showToast('✅ سبسکرپشن منظور', 'success');
    _renderSubsTab();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _rejectSub(subId) {
  await supabaseClient.from('subscriptions').update({status:'rejected'}).eq('id',subId);
  showToast('❌ رد کر دی', 'info');
  _renderSubsTab();
}

async function _suspendSub(subId) {
  await supabaseClient.from('subscriptions').update({status:'suspended'}).eq('id',subId);
  showToast('🔒 معطل', 'info');
  _renderSubsTab();
}
