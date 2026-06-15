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
      <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;">
        ${(o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()}
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;direction:rtl;">
    ${[
      ['📁','میرے مقدمات','cases'],
      ['➕','نیا اندراج','_newCase'],
      ['⚖️','پیشیاں','reminders'],
      ['🚔','گشت','patrol'],
      ['🚨','واقعہ','incident'],
    ].map(([i,l,p])=>`
    <button onclick="${p==='_newCase'?'openAddCaseModal()':'showPage(\''+p+'\',null)'}"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 4px;font-size:10px;font-family:'Jameel Noori Nastaleeq',serif;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;color:var(--text-secondary);transition:all 0.15s;"
      onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'">
      <span style="font-size:20px;">${i}</span>${l}
    </button>`).join('')}
  </div>

  <!-- Cases Stats Cards — new order -->
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;direction:rtl;font-weight:700;">📊 مقدمات کی صورتحال</div>
    <!-- Row 1: کل مقدمات full width -->
    <div onclick="showPage('cases',null)" style="background:linear-gradient(135deg,var(--accent),#0ea5e9);border-radius:10px;padding:12px 16px;margin-bottom:6px;cursor:pointer;direction:rtl;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:14px;font-weight:700;color:#fff;font-family:'Jameel Noori Nastaleeq',serif;">کل مقدمات</div>
      <div style="font-size:32px;font-weight:900;color:#fff;">${total}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.7);">آج ${todayCases.length} نئے</div>
    </div>
    <!-- Row 2: 6 status cards -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:6px;">
      ${[
        {k:'complete',   l:'چالان مکمل',    v:complete,   c:'var(--green)'},
        {k:'incomplete', l:'چالان نامکمل',   v:incomplete, c:'var(--amber)'},
        {k:'cancel',     l:'اخراج',          v:cancel,     c:'var(--red)'},
        {k:'challan512', l:'چالان 512',       v:challan512, c:'#f97316'},
        {k:'untrace',    l:'عدم پتہ',         v:untrace,    c:'#a78bfa'},
        {k:'under',      l:'زیر تفتیش',       v:under,      c:'var(--accent)'},
      ].map(s=>`
      <div onclick="showPage('cases',null)"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 8px;text-align:center;cursor:pointer;border-right:3px solid ${s.c};"
        onmouseover="this.style.background='var(--bg-secondary)'"
        onmouseout="this.style.background='var(--bg-card)'">
        <div style="font-size:9px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;margin-bottom:3px;">${s.l}</div>
        <div style="font-size:22px;font-weight:900;color:${s.c};">${s.v}</div>
        <div style="height:3px;background:${s.c};border-radius:2px;margin-top:4px;opacity:${total?s.v/total:0};"></div>
      </div>`).join('')}
    </div>
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
  </div>

  <!-- Charts Row: Monthly trend + Status donut -->
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px;">

    <!-- Monthly bar chart -->
    <div class="card" style="direction:rtl;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:14px;">📊 ماہانہ اندراج (6 ماہ)</div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding:0 6px;">
        ${monthly.map((m,i)=>{
          const max=Math.max(...monthly.map(x=>x.count),1);
          const pct=Math.round(m.count/max*100);
          const isCur=i===monthly.length-1;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;">
            ${m.count?`<div style="font-size:10px;color:${isCur?'var(--accent)':'var(--text-muted)'};font-weight:${isCur?'800':'600'};">${m.count}</div>`:'<div style="font-size:10px;">&nbsp;</div>'}
            <div style="width:100%;max-width:42px;background:${isCur?'var(--accent)':'rgba(56,189,248,0.3)'};border-radius:4px 4px 0 0;height:${Math.max(pct,3)}%;transition:height 0.4s;"></div>
            <div style="font-size:10px;color:${isCur?'var(--accent)':'var(--text-muted)'};font-weight:${isCur?'700':'400'};">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Status donut chart -->
    <div class="card" style="direction:rtl;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">⭕ مقدمات کی صورتحال</div>
      ${total ? `
      <div style="display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
        <div style="position:relative;width:110px;height:110px;border-radius:50%;background:conic-gradient(
          var(--green) 0% ${complete/total*100}%,
          var(--amber) ${complete/total*100}% ${(complete+incomplete)/total*100}%,
          var(--accent) ${(complete+incomplete)/total*100}% ${(complete+incomplete+under)/total*100}%,
          #a78bfa ${(complete+incomplete+under)/total*100}% ${(complete+incomplete+under+untrace)/total*100}%,
          var(--red) ${(complete+incomplete+under+untrace)/total*100}% 100%
        );display:flex;align-items:center;justify-content:center;">
          <div style="width:70px;height:70px;border-radius:50%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:24px;font-weight:900;color:var(--text-primary);">${total}</div>
            <div style="font-size:9px;color:var(--text-muted);">کل</div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;font-size:10px;">
        ${[
          ['مکمل',complete,'var(--green)'],
          ['نامکمل',incomplete,'var(--amber)'],
          ['زیر تفتیش',under,'var(--accent)'],
          ['عدم پتہ',untrace,'#a78bfa'],
          ['اخراج',cancel,'var(--red)'],
        ].filter(([,v])=>v>0).map(([l,v,c])=>`
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:10px;height:10px;border-radius:2px;background:${c};"></span>
          <span style="color:var(--text-secondary);flex:1;">${l}</span>
          <span style="font-weight:700;color:${c};">${v}</span>
        </div>`).join('')}
      </div>` : `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:12px;">ابھی کوئی ڈیٹا نہیں</div>`}
    </div>
  </div>`;
}

// ── HELPERS ───────────────────────────────────────────────────
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
  const{data}=await supabaseClient.from('reminders').select('*').eq('officer_id',oid).eq('is_done',false).order('reminder_date',{ascending:true});
  return data||[];
}
async function _dFetchPatrol() {
  const oid=await getOfficerId();
  const{count}=await supabaseClient.from('patrol_logs').select('*',{count:'exact',head:true}).eq('officer_id',oid);
  return count||0;
}
async function _dFetchFivec() {
  const oid=await getOfficerId();
  const{count}=await supabaseClient.from('applications_5c').select('*',{count:'exact',head:true}).eq('officer_id',oid);
  return count||0;
}
