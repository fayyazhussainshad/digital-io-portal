/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v4
   New card order · Full screen · Activity feed
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  container.innerHTML = `<div id="dash-root">
    <div style="text-align:center;padding:32px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">⏳ لوڈ ہو رہا ہے...</div>
  </div>`;
  await _buildDash();
}

async function _buildDash() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  const [cases, reminders, patrolCount, fivecApps] = await Promise.all([
    getCases().catch(()=>[]),
    _dFetchRem().catch(()=>[]),
    _dFetchPatrol().catch(()=>0),
    _dFetchFivec().catch(()=>0),
  ]);

  const today = new Date().toISOString().split('T')[0];

  // Status counts
  const total       = cases.length;
  const complete    = cases.filter(c=>c.status==='complete').length;
  const incomplete  = cases.filter(c=>c.status==='incomplete').length;
  const cancel      = cases.filter(c=>c.status==='cancel').length;
  const challan512  = cases.filter(c=>c.status==='challan512').length;
  const untrace     = cases.filter(c=>c.status==='untrace').length;
  const under       = cases.filter(c=>c.status==='under').length;
  const pendRem     = reminders.filter(r=>!r.is_done);
  const todayCases  = cases.filter(c=>{ const d=_pd(c.fir_date); return d&&d.startsWith(today); });

  const statusCounts = { complete, incomplete, cancel, challan512, untrace, under };
  const monthly = _monthlyTrend(cases);

  root.innerHTML = `
  <!-- Welcome -->
  <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:12px;padding:14px 18px;margin-bottom:14px;direction:rtl;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="text-align:right;flex:1;">
        <div style="font-size:16px;font-weight:800;color:#fff;font-family:'Jameel Noori Nastaleeq',serif;">خوش آمدید، ${o.full_name||'افسر'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);">${o.designation||''} · تھانہ ${o.station||''} · ضلع ${o.district||''}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);">${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div id="dash-welcome-avatar" style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;overflow:hidden;cursor:pointer;" onclick="showPage('settings',null)">
        ${(() => {
          let p = o.profile_photo;
          if (!p) { try { p = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url'); } catch(_) {} }
          if (p) return `<img src="${p}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          return (o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
        })()}
      </div>
    </div>
  </div>

  <!-- Cases Stats — 7 cards in one row (کل + 6 statuses) -->
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;direction:rtl;font-weight:700;">📊 مقدمات کی صورتحال</div>
    <div class="dash-stats-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;direction:rtl;">
      <!-- کل مقدمات -->
      <div onclick="showPage('cases',null)" style="background:linear-gradient(135deg,var(--accent),#0ea5e9);border-radius:10px;padding:10px 4px;cursor:pointer;height:88px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;">
        <div style="font-size:11px;color:rgba(255,255,255,0.9);font-family:'Jameel Noori Nastaleeq',serif;text-align:center;line-height:1.25;">کل مقدمات</div>
        <div style="font-size:24px;font-weight:900;color:#fff;text-align:center;">${total}</div>
      </div>
      ${[
        {k:'complete',   l:'چالان مکمل',  v:complete,   c:'var(--green)'},
        {k:'incomplete', l:'چالان نامکمل', v:incomplete, c:'var(--amber)'},
        {k:'cancel',     l:'اخراج',        v:cancel,     c:'var(--red)'},
        {k:'untrace',    l:'عدم پتہ',       v:untrace,    c:'#a78bfa'},
        {k:'under',      l:'زیر تفتیش',     v:under,      c:'var(--accent)'},
        {k:'challan512', l:'چالان 512',     v:challan512, c:'#f97316'},
      ].map(s=>`
      <div onclick="showPage('cases',null)"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 4px;cursor:pointer;border-bottom:3px solid ${s.c};height:88px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;"
        onmouseover="this.style.background='var(--bg-secondary)'"
        onmouseout="this.style.background='var(--bg-card)'">
        <div style="font-size:11px;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;line-height:1.25;text-align:center;">${s.l}</div>
        <div style="font-size:24px;font-weight:900;color:${s.c};text-align:center;">${s.v}</div>
      </div>`).join('')}
    </div>
    <style>
      @media (max-width:768px){
        .dash-stats-grid{ grid-template-columns:repeat(4,1fr) !important; }
      }
      @media (max-width:420px){
        .dash-stats-grid{ grid-template-columns:repeat(3,1fr) !important; }
      }
    </style>
  </div>

  <!-- Recently viewed (moved below stats, right-aligned) -->
  <div style="direction:rtl;text-align:right;margin-bottom:14px;">
    ${_recentlyViewedBar()}
  </div>

  <!-- Recent Cases (full width) -->
  <div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border);direction:rtl;">
      <div style="font-size:13px;font-weight:700;color:var(--accent);">📁 حالیہ مقدمات</div>
      <button class="btn btn-secondary btn-sm" onclick="showPage('cases',null)" style="font-size:11px;">سب دیکھیں →</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>مقدمہ نمبر</th><th>مدعی</th><th>دفعہ</th><th>صورتحال</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${cases.length ? cases.slice(0,10).map(c=>`<tr>
          <td style="font-weight:800;color:var(--accent);cursor:pointer;font-size:12px;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</td>
          <td style="font-size:11px;">${(c.complainant||'—').slice(0,20)}</td>
          <td style="font-size:10px;">${(c.section_of_law||'—').slice(0,15)}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}" style="font-size:9px;">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:10px;">${formatDate(c.fir_date)}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" style="padding:3px 8px;font-size:10px;">📄</button></td>
        </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">کوئی مقدمہ نہیں</td></tr>`}
      </tbody>
    </table>
    </div>
  </div>`;
}

// ── HELPERS ───────────────────────────────────────────────────
function _recentlyViewedBar() {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem('dio_recent_cases')||'[]'); } catch(_) {}
  if (!recent.length) return '';
  return `
  <div style="margin-bottom:14px;direction:rtl;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:700;">🕐 حال ہی میں دیکھے گئے</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${recent.map(r=>`
        <button onclick="openCaseWorkspace('${r.id}')"
          style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;color:var(--text-secondary);display:flex;align-items:center;gap:6px;"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <span style="color:var(--accent);font-weight:700;">FIR ${r.fir}</span>
          ${r.name?`<span style="font-size:10px;color:var(--text-muted);">${r.name.slice(0,15)}</span>`:''}
        </button>`).join('')}
    </div>
  </div>`;
}

function _monthlyTrend(cases) {
  const now = new Date();
  return Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { label:d.toLocaleString('default',{month:'short'}), count:cases.filter(c=>{ const p=_pd(c.fir_date); return p&&p.startsWith(key); }).length };
  });
}
function _pd(d) {
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  return p.length===3&&p[2].length===4?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:null;
}
async function _dFetchRem() {
  const oid=await getOfficerId();
  if(!oid || !navigator.onLine) return [];
  try { const{data}=await supabaseClient.from('reminders').select('*').eq('officer_id',oid).eq('is_done',false).order('reminder_date',{ascending:true}); return data||[]; }
  catch(_){ return []; }
}
async function _dFetchPatrol() {
  const oid=await getOfficerId();
  if(!oid || !navigator.onLine) return 0;
  try { const{count}=await supabaseClient.from('patrol_logs').select('*',{count:'exact',head:true}).eq('officer_id',oid); return count||0; }
  catch(_){ return 0; }
}
async function _dFetchFivec() {
  const oid=await getOfficerId();
  if(!oid || !navigator.onLine) return 0;
  try { const{count}=await supabaseClient.from('applications_5c').select('*',{count:'exact',head:true}).eq('officer_id',oid); return count||0; }
  catch(_){ return 0; }
}
