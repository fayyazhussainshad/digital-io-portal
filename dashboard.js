/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD  (dashboard.js)
   Stats · Charts · Recent cases · Court dates · Quiz
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  container.innerHTML = `<div style="padding:4px 0;" id="dash-root">
    <div style="text-align:center;padding:40px;color:var(--text-muted);">⏳ Loading...</div>
  </div>`;
  await _buildDashboard();
}

async function _buildDashboard() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  // Fetch all data in parallel
  const [cases, courtDates, reminders] = await Promise.all([
    getCases().catch(()=>[]),
    _fetchCourtDates().catch(()=>[]),
    _fetchReminders().catch(()=>[]),
  ]);

  // Stats
  const total    = cases.length;
  const active   = cases.filter(c=>c.status==='under').length;
  const complete  = cases.filter(c=>c.status==='complete').length;
  const untrace  = cases.filter(c=>c.status==='untrace').length;
  const today    = new Date().toISOString().split('T')[0];
  const upcoming = courtDates.filter(d=>d.hearing_date>=today&&d.status==='pending');
  const overdue  = courtDates.filter(d=>d.hearing_date<today&&d.status==='pending');
  const pendRem  = reminders.filter(r=>!r.is_done);

  // Status breakdown for chart
  const statusCounts = {};
  cases.forEach(c=>{ statusCounts[c.status]=(statusCounts[c.status]||0)+1; });

  // Monthly trend (last 6 months)
  const monthly = _getMonthlyTrend(cases);

  root.innerHTML = `
  <!-- Welcome -->
  <div style="background:linear-gradient(135deg,#1a3a5c,#0d2a45);border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
    <div style="width:52px;height:52px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;flex-shrink:0;">
      ${(o.full_name||'IO').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
    </div>
    <div>
      <div style="font-size:16px;font-weight:700;color:#fff;">خوش آمدید، ${o.full_name||'Officer'}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.6);">${o.designation||''} · ${o.station||''} · ${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long'})}</div>
    </div>
    ${overdue.length ? `<div style="margin-right:auto;background:#ef4444;color:#fff;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;">⚠️ ${overdue.length} پیشی گزر گئی</div>` : ''}
  </div>

  <!-- Stats Grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
    ${[
      ['کل مقدمات','📁',total,'var(--accent)'],
      ['زیر تفتیش','🔍',active,'var(--amber)'],
      ['مکمل','✅',complete,'var(--green)'],
      ['آنے والی پیشیاں','⚖️',upcoming.length,'#a78bfa'],
    ].map(([l,i,v,c])=>`
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;margin-bottom:4px;">${i}</div>
        <div style="font-size:26px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${l}</div>
      </div>`).join('')}
  </div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

    <!-- Status Pie Chart -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;">📊 مقدمات کی صورتحال</div>
      <div style="display:flex;gap:12px;align-items:center;">
        <canvas id="dash-pie" width="120" height="120" style="flex-shrink:0;"></canvas>
        <div style="flex:1;">
          ${Object.entries({under:'زیر تفتیش',complete:'مکمل',incomplete:'نامکمل',untrace:'عدم پتہ',cancel:'اخراج'})
            .map(([k,l])=>`
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${_statusColor(k)};flex-shrink:0;"></div>
              <div style="font-size:11px;color:var(--text-secondary);flex:1;">${l}</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-primary);">${statusCounts[k]||0}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Monthly Bar Chart -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;">📈 ماہانہ رجسٹریشن (6 ماہ)</div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:100px;">
        ${monthly.map(m=>{
          const max = Math.max(...monthly.map(x=>x.count),1);
          const pct = Math.round(m.count/max*100);
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="font-size:10px;color:var(--accent);font-weight:700;">${m.count||''}</div>
            <div style="width:100%;background:var(--accent);border-radius:3px 3px 0 0;height:${Math.max(pct*0.8,2)}px;opacity:0.85;"></div>
            <div style="font-size:9px;color:var(--text-faint);">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- Court Dates + Reminders Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

    <!-- Upcoming Court Dates -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);">⚖️ آنے والی پیشیاں</div>
        <button class="btn btn-secondary btn-sm" onclick="showPage('court',document.querySelector('.nav-item[onclick*=court]'))">سب دیکھیں</button>
      </div>
      ${upcoming.length ? upcoming.slice(0,5).map(d=>`
        <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
          <div style="background:var(--accent);color:#fff;border-radius:6px;padding:4px 8px;text-align:center;flex-shrink:0;min-width:36px;">
            <div style="font-size:14px;font-weight:800;line-height:1;">${new Date(d.hearing_date).getDate()}</div>
            <div style="font-size:8px;">${new Date(d.hearing_date).toLocaleString('default',{month:'short'})}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">FIR ${d.fir_number||'—'}</div>
            <div style="font-size:10px;color:var(--text-muted);">${d.court_name||'—'} · ${d.hearing_time||'—'}</div>
            <div style="font-size:10px;color:var(--text-faint);">${d.purpose||''}</div>
          </div>
        </div>`).join('')
      : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">کوئی پیشی نہیں</div>`}
      ${overdue.length ? `<div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:6px;padding:8px;margin-top:8px;">
        <div style="font-size:11px;color:var(--red);font-weight:700;">⚠️ ${overdue.length} پیشیاں گزر گئیں</div>
        ${overdue.slice(0,2).map(d=>`<div style="font-size:10px;color:var(--red);">FIR ${d.fir_number} — ${d.hearing_date}</div>`).join('')}
      </div>` : ''}
    </div>

    <!-- Pending Reminders -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;">🔔 زیر التواء یاددہانیاں (${pendRem.length})</div>
      ${pendRem.length ? pendRem.slice(0,5).map(r=>`
        <div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">
          <span style="font-size:16px;">🔔</span>
          <div style="flex:1;">
            <div style="font-size:12px;">${r.text}</div>
            <div style="font-size:10px;color:var(--accent);">${formatDate(r.reminder_date)}</div>
          </div>
        </div>`).join('')
      : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">کوئی یاددہانی نہیں</div>`}
    </div>
  </div>

  <!-- Recent Cases -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);">📁 حالیہ مقدمات</div>
      <button class="btn btn-secondary btn-sm" onclick="showPage('cases',document.querySelector('.nav-item[onclick*=cases]'))">سب دیکھیں</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>FIR نمبر</th><th>مدعی</th><th>دفعہ</th><th>صورتحال</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${cases.slice(0,8).map(c=>`<tr>
          <td style="font-weight:800;color:var(--accent);cursor:pointer;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</td>
          <td style="font-size:12px;">${c.complainant||'—'}</td>
          <td style="font-size:11px;">${c.section_of_law||'—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:11px;">${formatDate(c.fir_date)}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')">📄</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`;

  // Draw pie chart
  setTimeout(()=>_drawPie(statusCounts), 100);
}

// ── PIE CHART ─────────────────────────────────────────────────
function _drawPie(counts) {
  const canvas = document.getElementById('dash-pie');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = Object.values(counts).reduce((a,b)=>a+b,0)||1;
  const keys = ['under','complete','incomplete','untrace','cancel'];
  let startAngle = -Math.PI/2;
  const cx=60,cy=60,r=50;
  ctx.clearRect(0,0,120,120);
  keys.forEach(k=>{
    const val = counts[k]||0;
    if(!val)return;
    const slice = (val/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,startAngle,startAngle+slice);
    ctx.closePath();
    ctx.fillStyle=_statusColor(k);
    ctx.fill();
    startAngle+=slice;
  });
  // Center hole
  ctx.beginPath();
  ctx.arc(cx,cy,28,0,Math.PI*2);
  ctx.fillStyle='var(--bg-card)';
  ctx.fill();
  // Total in center
  ctx.fillStyle='#fff';
  ctx.font='bold 16px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(total,cx,cy);
}

function _statusColor(k) {
  return {under:'#38bdf8',complete:'#22c55e',incomplete:'#f59e0b',untrace:'#a78bfa',cancel:'#ef4444'}[k]||'#888';
}

// ── MONTHLY TREND ─────────────────────────────────────────────
function _getMonthlyTrend(cases) {
  const months = [];
  const now = new Date();
  for (let i=5;i>=0;i--) {
    const d = new Date(now.getFullYear(),now.getMonth()-i,1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default',{month:'short'});
    const count = cases.filter(c=>{
      if(!c.fir_date)return false;
      const pd=_parseDateStr(c.fir_date);
      return pd&&pd.startsWith(key);
    }).length;
    months.push({key,label,count});
  }
  return months;
}

function _parseDateStr(d) {
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  if(p.length===3&&p[2].length===4)return`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return null;
}

// ── DATA FETCHERS ─────────────────────────────────────────────
async function _fetchCourtDates() {
  const oid=await getOfficerId();
  const{data}=await supabaseClient.from('court_dates').select('*').eq('officer_id',oid).order('hearing_date',{ascending:true});
  return data||[];
}
async function _fetchReminders() {
  const oid=await getOfficerId();
  const{data}=await supabaseClient.from('reminders').select('*').eq('officer_id',oid).eq('is_done',false).order('reminder_date',{ascending:true});
  return data||[];
}
