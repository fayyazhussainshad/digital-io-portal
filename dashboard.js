/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v2  (dashboard.js)
   Enhanced charts · Live stats · Quick actions · Alerts
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  container.innerHTML = `<div style="padding:4px 0;" id="dash-root">
    <div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:32px;margin-bottom:8px;">⏳</div>
      <div>ڈیش بورڈ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;
  await _buildDashboard();
}

async function _buildDashboard() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  const [cases, courtDates, reminders, patrol] = await Promise.all([
    getCases().catch(()=>[]),
    _fetchCourtDates().catch(()=>[]),
    _fetchReminders().catch(()=>[]),
    _fetchPatrolCount().catch(()=>0),
  ]);

  const today    = new Date().toISOString().split('T')[0];
  const total    = cases.length;
  const active   = cases.filter(c=>c.status==='under').length;
  const complete = cases.filter(c=>c.status==='complete').length;
  const untrace  = cases.filter(c=>c.status==='untrace').length;
  const upcoming = courtDates.filter(d=>d.hearing_date>=today&&d.status==='pending');
  const overdue  = courtDates.filter(d=>d.hearing_date<today&&d.status==='pending');
  const pendRem  = reminders.filter(r=>!r.is_done);
  const todayCases = cases.filter(c=>{const d=_parseDateStr(c.fir_date);return d&&d.startsWith(today);});
  const statusCounts = {};
  cases.forEach(c=>{statusCounts[c.status]=(statusCounts[c.status]||0)+1;});
  const monthly = _getMonthlyTrend(cases);
  const weeklyData = _getWeeklyTrend(cases);

  root.innerHTML = `
  <!-- Welcome Banner -->
  <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c,#1e4976);border-radius:14px;padding:18px 22px;margin-bottom:16px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(56,189,248,0.08);"></div>
    <div style="position:absolute;bottom:-30px;right:60px;width:80px;height:80px;border-radius:50%;background:rgba(56,189,248,0.05);"></div>
    <div style="display:flex;align-items:center;gap:14px;position:relative;">
      <div style="width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 14px rgba(56,189,248,0.4);">
        ${(o.full_name||'IO').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div style="flex:1;">
        <div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:2px;">خوش آمدید، ${o.full_name||'Officer'}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);">${o.designation||''} · تھانہ ${o.station||''} · ضلع ${o.district||''}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div style="text-align:left;">
        ${overdue.length?`<div style="background:#ef4444;color:#fff;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;margin-bottom:4px;">⚠️ ${overdue.length} پیشی گزر گئی</div>`:''}
        ${pendRem.length?`<div style="background:var(--amber);color:#000;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;">🔔 ${pendRem.length} یاددہانی</div>`:''}
      </div>
    </div>
  </div>

  <!-- Islamic Messages Ticker -->
  <div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.15);border-radius:10px;padding:10px 16px;margin-bottom:16px;text-align:center;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;">
    <span id="islamic-ticker" style="font-size:15px;color:var(--accent);transition:opacity 0.4s;">🤲 اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ — درود شریف پڑھیں</span>
  </div>

  <!-- Stats Grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {l:'کل مقدمات',    v:total,          i:'📁', c:'var(--accent)', sub:'مجموعی اندراج'},
      {l:'زیر تفتیش',   v:active,         i:'🔍', c:'var(--amber)',  sub:`${total?Math.round(active/total*100):0}% کیسز`},
      {l:'مکمل',         v:complete,       i:'✅', c:'var(--green)',  sub:`${total?Math.round(complete/total*100):0}% completion`},
      {l:'آنے والی پیشیاں',v:upcoming.length,i:'⚖️',c:'#a78bfa',    sub:`${overdue.length} overdue`},
    ].map(s=>`
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px 14px;position:relative;overflow:hidden;cursor:pointer;transition:transform 0.15s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="position:absolute;top:-8px;left:-8px;font-size:48px;opacity:0.07;">${s.i}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600;">${s.l}</div>
        <div style="font-size:30px;font-weight:900;color:${s.c};line-height:1;">${s.v}</div>
        <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">${s.sub}</div>
      </div>`).join('')}
  </div>

  <!-- Quick Actions -->
  <div style="display:flex;gap:8px;direction:rtl;margin-bottom:16px;flex-wrap:wrap;">
    <button class="btn btn-primary" onclick="showPage('cases',document.querySelector('.nav-item[onclick*=cases]'))" style="flex:1;min-width:120px;">📁 مقدمات</button>
    <button class="btn btn-secondary" onclick="openAddCaseModal()" style="flex:1;min-width:120px;">+ نیا اندراج</button>
    <button class="btn btn-secondary" onclick="showPage('court',document.querySelector('.nav-item[onclick*=court]'))" style="flex:1;min-width:120px;">⚖️ پیشیاں</button>
    <button class="btn btn-secondary" onclick="showPage('patrol',document.querySelector('.nav-item[onclick*=patrol]'))" style="flex:1;min-width:120px;">🚔 پیٹرول لاگ</button>
    <button class="btn btn-secondary" onclick="showPage('incident',document.querySelector('.nav-item[onclick*=incident]'))" style="flex:1;min-width:120px;">🚨 Incident</button>
  </div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

    <!-- Donut Chart — Status -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:14px;letter-spacing:0.5px;">📊 مقدمات کی صورتحال</div>
      <div style="display:flex;gap:16px;direction:rtl;align-items:center;">
        <div style="position:relative;flex-shrink:0;">
          <canvas id="dash-donut" width="110" height="110"></canvas>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
            <div style="font-size:20px;font-weight:900;color:var(--text-primary);">${total}</div>
            <div style="font-size:9px;color:var(--text-muted);">total</div>
          </div>
        </div>
        <div style="flex:1;">
          ${Object.entries({under:'زیر تفتیش',complete:'مکمل',incomplete:'نامکمل',untrace:'عدم پتہ',cancel:'اخراج'}).map(([k,l])=>`
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${_statusColor(k)};flex-shrink:0;"></div>
            <div style="font-size:11px;color:var(--text-secondary);flex:1;">${l}</div>
            <div style="font-size:13px;font-weight:800;color:${_statusColor(k)};">${statusCounts[k]||0}</div>
            <div style="font-size:10px;color:var(--text-faint);min-width:28px;text-align:right;">${total?Math.round((statusCounts[k]||0)/total*100):0}%</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Bar Chart — Monthly -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:14px;letter-spacing:0.5px;">📈 ماہانہ اندراج (6 ماہ)</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:90px;margin-bottom:8px;">
        ${monthly.map((m,i)=>{
          const max=Math.max(...monthly.map(x=>x.count),1);
          const pct=Math.round(m.count/max*100);
          const isLast=i===monthly.length-1;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
            ${m.count?`<div style="font-size:9px;color:${isLast?'var(--accent)':'var(--text-faint)'};font-weight:${isLast?'800':'400'};">${m.count}</div>`:'<div style="font-size:9px;"></div>'}
            <div style="width:100%;background:${isLast?'var(--accent)':'rgba(56,189,248,0.35)'};border-radius:4px 4px 0 0;height:${Math.max(pct*0.78,2)}px;transition:height 0.3s;"></div>
            <div style="font-size:9px;color:${isLast?'var(--accent)':'var(--text-faint)'};font-weight:${isLast?'700':'400'};">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:10px;color:var(--text-faint);text-align:center;">گہرا رنگ = رواں ماہ</div>
    </div>
  </div>

  <!-- Weekly + Status breakdown row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

    <!-- Weekly bar chart -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:14px;">📅 ہفتہ وار اندراج (7 دن)</div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:70px;margin-bottom:6px;">
        ${weeklyData.map(d=>{
          const max=Math.max(...weeklyData.map(x=>x.count),1);
          const pct=Math.round(d.count/max*100);
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;" title="${d.label}: ${d.count}">
            <div style="width:100%;background:var(--green);border-radius:3px 3px 0 0;height:${Math.max(pct*0.6,2)}px;opacity:${d.isToday?1:0.5};"></div>
            <div style="font-size:8px;color:${d.isToday?'var(--green)':'var(--text-faint)'};">${d.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-faint);">
        <span>گہرا = آج</span>
        <span>کل آج: ${todayCases.length} نئے</span>
      </div>
    </div>

    <!-- Progress rings -->
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:14px;">🎯 کارکردگی کا جائزہ</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[
          {l:'تکمیل شرح', v:total?Math.round(complete/total*100):0, c:'var(--green)'},
          {l:'زیر تفتیش', v:total?Math.round(active/total*100):0, c:'var(--amber)'},
          {l:'عدم پتہ',    v:total?Math.round(untrace/total*100):0, c:'#a78bfa'},
        ].map(r=>`
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-bottom:4px;">
              <span>${r.l}</span>
              <span style="font-weight:700;color:${r.c};">${r.v}%</span>
            </div>
            <div style="background:var(--bg-tertiary);border-radius:6px;overflow:hidden;height:8px;">
              <div style="background:${r.c};height:100%;width:${r.v}%;border-radius:6px;transition:width 0.5s;"></div>
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:12px;padding:10px;background:var(--bg-secondary);border-radius:8px;text-align:center;">
        <div style="font-size:11px;color:var(--text-muted);">پیٹرول لاگ اندراج</div>
        <div style="font-size:22px;font-weight:900;color:var(--accent);">${patrol}</div>
      </div>
    </div>
  </div>

  <!-- Court + Reminders -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">

    <!-- Upcoming Court -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);">⚖️ آنے والی پیشیاں (${upcoming.length})</div>
        <button class="btn btn-secondary btn-sm" onclick="showPage('court',document.querySelector('.nav-item[onclick*=court]'))">سب →</button>
      </div>
      ${upcoming.length ? upcoming.slice(0,4).map(d=>{
        const dt=new Date(d.hearing_date);
        const diff=Math.ceil((dt-new Date())/(1000*60*60*24));
        const urg=diff<=3?'var(--red)':diff<=7?'var(--amber)':'var(--accent)';
        return `<div style="display:flex;gap:8px;direction:rtl;padding:7px 0;border-bottom:1px solid var(--border);align-items:center;">
          <div style="background:${urg};color:#fff;border-radius:6px;padding:4px 8px;text-align:center;flex-shrink:0;min-width:36px;">
            <div style="font-size:14px;font-weight:800;line-height:1;">${dt.getDate()}</div>
            <div style="font-size:8px;">${dt.toLocaleString('default',{month:'short'})}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">FIR ${d.fir_number||'—'}</div>
            <div style="font-size:10px;color:var(--text-muted);">${d.court_name||'—'} · ${d.hearing_time||'—'}</div>
          </div>
          ${diff<=3?`<span style="font-size:9px;background:var(--red);color:#fff;padding:2px 5px;border-radius:6px;">${diff===0?'آج':diff+'d'}</span>`:''}
        </div>`;
      }).join('')
      :`<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px;">✅ کوئی آنے والی پیشی نہیں</div>`}
      ${overdue.length?`<div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:6px;padding:8px;margin-top:8px;font-size:11px;color:var(--red);font-weight:700;">⚠️ ${overdue.length} پیشیاں گزر گئیں!</div>`:''}
    </div>

    <!-- Reminders -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);">🔔 یاددہانیاں (${pendRem.length})</div>
        <button class="btn btn-secondary btn-sm" onclick="showPage('reminders',document.querySelector('.nav-item[onclick*=reminders]'))">سب →</button>
      </div>
      ${pendRem.length ? pendRem.slice(0,4).map(r=>{
        const isOver=r.reminder_date&&r.reminder_date<today;
        return `<div style="display:flex;gap:8px;direction:rtl;padding:7px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
          <span style="font-size:16px;">${isOver?'⚠️':'🔔'}</span>
          <div style="flex:1;">
            <div style="font-size:12px;${isOver?'color:var(--red);':''}">${r.text}</div>
            <div style="font-size:10px;color:${isOver?'var(--red)':'var(--accent)'};">${formatDate(r.reminder_date)}</div>
          </div>
        </div>`;
      }).join('')
      :`<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px;">✅ کوئی یاددہانی نہیں</div>`}
    </div>
  </div>

  <!-- Recent Cases -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:12px;font-weight:700;color:var(--accent);">📁 حالیہ مقدمات</div>
      <button class="btn btn-secondary btn-sm" onclick="showPage('cases',document.querySelector('.nav-item[onclick*=cases]'))">سب →</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>مقدمہ نمبر</th><th>مدعی</th><th>دفعہ</th><th>صورتحال</th><th>تاریخ</th><th></th></tr></thead>
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

  // Draw charts after DOM ready
  setTimeout(() => {
    _drawDonut(statusCounts, total);
    _startIslamicTicker();
  }, 120);
}

function _startIslamicTicker() {
  const msgs = [
    '🤲 اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ — درود شریف پڑھیں',
    '📖 وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا — جو اللہ سے ڈرے اللہ اس کے لیے راستہ نکالتا ہے',
    '🤲 سُبْحَانَ اللَّهِ وَبِحَمْدِهِ — اللہ کی پاکی اور تعریف بیان کریں',
    '📖 إِنَّ مَعَ الْعُسْرِ يُسْرًا — بے شک تکلیف کے ساتھ آسانی ہے',
    '🤲 اَلْحَمْدُ لِلّٰہِ رَبِّ الْعٰلَمِیْنَ — تمام تعریفیں اللہ کے لیے ہیں',
    '📖 وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا — اللہ پر توکل کریں، وہ کافی ہے',
    '🤲 اَسْتَغْفِرُاللّٰہَ الْعَظِیْم — اللہ سے معافی مانگیں',
    '📖 فَإِنَّ مَعَ الْعُسْرِ يُسْرًا — پس بے شک تکلیف کے ساتھ آسانی ہے',
    '🤲 لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
    '📖 اللہ اپنے بندوں کے گناہ معاف فرماتا ہے — توبہ کریں',
  ];
  let i = 0;
  const el = document.getElementById('islamic-ticker');
  if (!el) return;
  el.textContent = msgs[0];
  setInterval(() => {
    i = (i + 1) % msgs.length;
    el.style.opacity = '0';
    setTimeout(() => {
      if (document.getElementById('islamic-ticker')) {
        document.getElementById('islamic-ticker').textContent = msgs[i];
        document.getElementById('islamic-ticker').style.opacity = '1';
      }
    }, 400);
  }, 8000);
}

// ── DONUT CHART ───────────────────────────────────────────────
function _drawDonut(counts, total) {
  const canvas = document.getElementById('dash-donut');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const keys = ['under','complete','incomplete','untrace','cancel'];
  const cx=55, cy=55, rOuter=48, rInner=32;
  ctx.clearRect(0,0,110,110);
  if (!total) {
    ctx.beginPath(); ctx.arc(cx,cy,rOuter,0,Math.PI*2);
    ctx.strokeStyle='var(--border)'; ctx.lineWidth=16; ctx.stroke(); return;
  }
  let angle = -Math.PI/2;
  keys.forEach(k => {
    const val = counts[k]||0;
    if (!val) return;
    const slice = (val/total)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,rOuter,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle = _statusColor(k);
    ctx.fill();
    angle += slice;
  });
  // Hole
  ctx.beginPath();
  ctx.arc(cx,cy,rInner,0,Math.PI*2);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card') || '#1a2332';
  ctx.fill();
}

function _statusColor(k) {
  return {under:'#38bdf8',complete:'#22c55e',incomplete:'#f59e0b',untrace:'#a78bfa',cancel:'#ef4444'}[k]||'#888';
}

// ── DATA HELPERS ──────────────────────────────────────────────
function _getMonthlyTrend(cases) {
  const now = new Date();
  return Array.from({length:6},(_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleString('default',{month:'short'});
    const count = cases.filter(c=>{ const p=_parseDateStr(c.fir_date); return p&&p.startsWith(key); }).length;
    return {key, label, count};
  });
}

function _getWeeklyTrend(cases) {
  const now = new Date();
  return Array.from({length:7},(_,i) => {
    const d = new Date(now); d.setDate(now.getDate()-6+i);
    const key = d.toISOString().split('T')[0];
    const isToday = key === now.toISOString().split('T')[0];
    const label = d.toLocaleString('default',{weekday:'short'}).slice(0,2);
    const count = cases.filter(c=>{ const p=_parseDateStr(c.fir_date); return p&&p.startsWith(key); }).length;
    return {key, label, count, isToday};
  });
}

function _parseDateStr(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d;
  const p = d.split(/[-\/]/);
  if (p.length===3&&p[2].length===4) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return null;
}

async function _fetchCourtDates() {
  const oid = await getOfficerId();
  const { data } = await supabaseClient.from('court_dates').select('*').eq('officer_id',oid).order('hearing_date',{ascending:true});
  return data||[];
}
async function _fetchReminders() {
  const oid = await getOfficerId();
  const { data } = await supabaseClient.from('reminders').select('*').eq('officer_id',oid).eq('is_done',false).order('reminder_date',{ascending:true});
  return data||[];
}
async function _fetchPatrolCount() {
  const oid = await getOfficerId();
  const { count } = await supabaseClient.from('patrol_logs').select('*',{count:'exact',head:true}).eq('officer_id',oid);
  return count||0;
}
