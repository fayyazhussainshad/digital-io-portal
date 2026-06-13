/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v3  (dashboard.js)
   Live stats · Donut chart · Weekly/Monthly bars · Quick actions
   Islamic messages · Court alerts · Recent cases
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  container.innerHTML = `<div id="dash-root" style="padding:0;">
    <div style="text-align:center;padding:32px;color:var(--text-muted);">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>
      <div style="font-family:'Jameel Noori Nastaleeq',serif;">ڈیش بورڈ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;
  await _buildDash();
}

async function _buildDash() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  const [cases, courtDates, reminders, patrolCount] = await Promise.all([
    getCases().catch(()=>[]),
    _dFetchCourt().catch(()=>[]),
    _dFetchRem().catch(()=>[]),
    _dFetchPatrol().catch(()=>0),
  ]);

  const today    = new Date().toISOString().split('T')[0];
  const total    = cases.length;
  const active   = cases.filter(c=>c.status==='under').length;
  const complete = cases.filter(c=>c.status==='complete').length;
  const untrace  = cases.filter(c=>c.status==='untrace').length;
  const upcoming = courtDates.filter(d=>d.hearing_date>=today&&d.status==='pending');
  const overdue  = courtDates.filter(d=>d.hearing_date<today&&d.status==='pending');
  const pendRem  = reminders.filter(r=>!r.is_done);
  const todayCases = cases.filter(c=>{ const d=_pd(c.fir_date); return d&&d.startsWith(today); });

  const statusCounts = {};
  cases.forEach(c=>{ statusCounts[c.status]=(statusCounts[c.status]||0)+1; });
  const monthly = _monthlyTrend(cases);
  const weekly  = _weeklyTrend(cases);

  root.innerHTML = `
  <!-- Islamic Ticker -->
  <div id="dash-ticker" style="background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:7px 16px;margin-bottom:14px;text-align:center;direction:rtl;min-height:34px;display:flex;align-items:center;justify-content:center;">
    <span id="islamic-ticker" style="font-size:14px;color:var(--accent);font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;transition:opacity 0.4s;"></span>
  </div>

  <!-- Welcome Banner -->
  <div style="background:linear-gradient(135deg,#0d2a45 0%,#1a3a5c 60%,#1e4976 100%);border-radius:14px;padding:16px 20px;margin-bottom:14px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-20px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(56,189,248,0.06);"></div>
    <div style="position:absolute;bottom:-30px;left:60px;width:70px;height:70px;border-radius:50%;background:rgba(56,189,248,0.04);"></div>
    <div style="display:flex;align-items:center;gap:14px;position:relative;direction:rtl;">
      <div style="text-align:right;flex:1;">
        <div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:2px;font-family:'Jameel Noori Nastaleeq',serif;">خوش آمدید، ${o.full_name||'افسر'}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65);">${o.designation||''} · تھانہ ${o.station||''} · ضلع ${o.district||''}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;" id="dash-date">${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 14px rgba(56,189,248,0.35);">
        ${(o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()}
      </div>
    </div>
    ${overdue.length||pendRem.length ? `
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;direction:rtl;">
      ${overdue.length?`<span style="background:var(--red);color:#fff;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;">⚠️ ${overdue.length} پیشی گزر گئی</span>`:''}
      ${pendRem.length?`<span style="background:var(--amber);color:#000;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;">🔔 ${pendRem.length} یاددہانی</span>`:''}
    </div>` : ''}
  </div>

  <!-- Stats Grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
    ${[
      {l:'کل مقدمات',    v:total,          i:'📁', c:'var(--accent)', s:`آج ${todayCases.length} نئے`},
      {l:'زیر تفتیش',   v:active,         i:'🔍', c:'var(--amber)',  s:`${total?Math.round(active/total*100):0}% مقدمات`},
      {l:'مکمل',         v:complete,       i:'✅', c:'var(--green)',  s:`${total?Math.round(complete/total*100):0}% تکمیل`},
      {l:'آنے والی پیشیاں',v:upcoming.length,i:'⚖️',c:'#a78bfa',   s:overdue.length?`⚠️ ${overdue.length} گزر گئی`:'سب ٹھیک'},
    ].map(s=>`
    <div onclick="showPage('${s.i==='⚖️'?'reminders':'cases'}',null)"
      style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:13px 10px;text-align:center;cursor:pointer;transition:all 0.15s;"
      onmouseover="this.style.borderColor='${s.c}';this.style.transform='translateY(-2px)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;font-family:'Jameel Noori Nastaleeq',serif;">${s.l}</div>
      <div style="font-size:26px;font-weight:900;color:${s.c};line-height:1;">${s.v}</div>
      <div style="font-size:9px;color:var(--text-faint);margin-top:3px;">${s.s}</div>
    </div>`).join('')}
  </div>

  <!-- Quick Actions -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;direction:rtl;">
    ${[
      ['📁','میرے مقدمات','cases'],
      ['+ نیا','اندراج','_newCase'],
      ['⚖️','پیشیاں','reminders'],
      ['🚔','گشت','patrol'],
      ['🚨','واقعہ','incident'],
    ].map(([i,l,p])=>`
    <button onclick="${p==='_newCase'?'openAddCaseModal()':'showPage(\''+p+'\',null)'}"
      class="btn btn-secondary" style="padding:10px 4px;font-size:11px;font-family:\'Jameel Noori Nastaleeq\',serif;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <span style="font-size:18px;">${i}</span>${l}
    </button>`).join('')}
  </div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">

    <!-- Donut -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;letter-spacing:0.5px;">📊 مقدمات کی صورتحال</div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="position:relative;flex-shrink:0;width:100px;height:100px;">
          <canvas id="dash-donut" width="100" height="100"></canvas>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
            <div style="font-size:18px;font-weight:900;color:var(--text-primary);">${total}</div>
            <div style="font-size:8px;color:var(--text-muted);">total</div>
          </div>
        </div>
        <div style="flex:1;">
          ${Object.entries({under:'زیر تفتیش',complete:'مکمل',incomplete:'نامکمل',untrace:'عدم پتہ',cancel:'اخراج'}).map(([k,l])=>`
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;direction:rtl;">
            <div style="font-size:11px;color:var(--text-secondary);flex:1;">${l}</div>
            <div style="font-size:12px;font-weight:800;color:${_sc(k)};">${statusCounts[k]||0}</div>
            <div style="width:7px;height:7px;border-radius:50%;background:${_sc(k)};flex-shrink:0;"></div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Monthly Bar -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;letter-spacing:0.5px;">📈 ماہانہ اندراج</div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:6px;">
        ${monthly.map((m,i)=>{
          const max=Math.max(...monthly.map(x=>x.count),1);
          const pct=Math.round(m.count/max*100);
          const isCur=i===monthly.length-1;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;" title="${m.label}: ${m.count}">
            ${m.count?`<div style="font-size:8px;color:${isCur?'var(--accent)':'var(--text-faint)'};font-weight:${isCur?'800':'400'};">${m.count}</div>`:'<div style="font-size:8px;"></div>'}
            <div style="width:100%;background:${isCur?'var(--accent)':'rgba(56,189,248,0.3)'};border-radius:3px 3px 0 0;height:${Math.max(pct*0.65,2)}px;"></div>
            <div style="font-size:8px;color:${isCur?'var(--accent)':'var(--text-faint)'};font-weight:${isCur?'700':'400'};">${m.label}</div>
          </div>`;}).join('')}
      </div>
    </div>
  </div>

  <!-- Weekly + Performance -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">

    <!-- Weekly -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;">📅 ہفتہ وار (7 دن)</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:60px;margin-bottom:5px;">
        ${weekly.map(d=>{
          const max=Math.max(...weekly.map(x=>x.count),1);
          const pct=Math.round(d.count/max*100);
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:100%;background:${d.isToday?'var(--green)':'rgba(34,197,94,0.3)'};border-radius:2px 2px 0 0;height:${Math.max(pct*0.5,2)}px;"></div>
            <div style="font-size:7px;color:${d.isToday?'var(--green)':'var(--text-faint)'};">${d.label}</div>
          </div>`;}).join('')}
      </div>
      <div style="font-size:9px;color:var(--text-faint);direction:rtl;">گہرا = آج · کل آج: ${todayCases.length}</div>
    </div>

    <!-- Performance bars -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;">🎯 کارکردگی</div>
      ${[
        {l:'تکمیل شرح', v:total?Math.round(complete/total*100):0, c:'var(--green)'},
        {l:'زیر تفتیش', v:total?Math.round(active/total*100):0, c:'var(--amber)'},
        {l:'عدم پتہ',    v:total?Math.round(untrace/total*100):0, c:'#a78bfa'},
      ].map(r=>`
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-bottom:3px;direction:rtl;">
          <span>${r.l}</span><span style="font-weight:700;color:${r.c};">${r.v}%</span>
        </div>
        <div style="background:var(--bg-tertiary);border-radius:4px;overflow:hidden;height:6px;">
          <div style="background:${r.c};height:100%;width:${r.v}%;border-radius:4px;transition:width 0.6s;"></div>
        </div>
      </div>`).join('')}
      <div style="margin-top:10px;text-align:center;background:var(--bg-secondary);border-radius:6px;padding:6px;">
        <div style="font-size:9px;color:var(--text-muted);direction:rtl;">گشت اندراجات</div>
        <div style="font-size:18px;font-weight:900;color:var(--accent);">${patrolCount}</div>
      </div>
    </div>
  </div>

  <!-- Court + Reminders -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--accent);">⚖️ پیشیاں (${upcoming.length})</div>
        <button class="btn btn-secondary btn-sm" onclick="showPage('reminders',null)" style="font-size:10px;">سب →</button>
      </div>
      ${upcoming.length ? upcoming.slice(0,4).map(d=>{
        const dt=new Date(d.hearing_date);
        const diff=Math.ceil((dt-new Date())/(1000*60*60*24));
        const urg=diff<=3?'var(--red)':diff<=7?'var(--amber)':'var(--accent)';
        return `<div style="display:flex;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);align-items:center;direction:rtl;">
          <div style="background:${urg};color:#fff;border-radius:5px;padding:3px 6px;text-align:center;flex-shrink:0;min-width:32px;">
            <div style="font-size:13px;font-weight:800;line-height:1;">${dt.getDate()}</div>
            <div style="font-size:7px;">${dt.toLocaleString('default',{month:'short'})}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;font-weight:600;">FIR ${d.fir_number||'—'}</div>
            <div style="font-size:9px;color:var(--text-muted);">${d.court_name||'—'}</div>
          </div>
          ${diff<=3?`<span style="font-size:8px;background:var(--red);color:#fff;padding:1px 4px;border-radius:5px;">${diff===0?'آج':diff+'d'}</span>`:''}
        </div>`;}).join('')
      :`<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:11px;">✅ کوئی پیشی نہیں</div>`}
      ${overdue.length?`<div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:5px;padding:6px;margin-top:6px;font-size:10px;color:var(--red);font-weight:700;direction:rtl;">⚠️ ${overdue.length} پیشیاں گزر گئیں</div>`:''}
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--accent);">🔔 یاددہانیاں (${pendRem.length})</div>
        <button class="btn btn-secondary btn-sm" onclick="showPage('reminders',null)" style="font-size:10px;">سب →</button>
      </div>
      ${pendRem.length ? pendRem.slice(0,4).map(r=>{
        const isOver=r.reminder_date&&r.reminder_date<today;
        return `<div style="display:flex;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);direction:rtl;">
          <span style="font-size:13px;">${isOver?'⚠️':'🔔'}</span>
          <div style="flex:1;">
            <div style="font-size:11px;${isOver?'color:var(--red);':''}">${r.text.slice(0,60)}${r.text.length>60?'...':''}</div>
            <div style="font-size:9px;color:${isOver?'var(--red)':'var(--accent)'};">${formatDate(r.reminder_date)}</div>
          </div>
        </div>`;}).join('')
      :`<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:11px;">✅ کوئی یاددہانی نہیں</div>`}
    </div>
  </div>

  <!-- Recent Cases -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;direction:rtl;">
      <div style="font-size:11px;font-weight:700;color:var(--accent);">📁 حالیہ مقدمات</div>
      <button class="btn btn-secondary btn-sm" onclick="showPage('cases',null)" style="font-size:10px;">سب →</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;min-width:500px;">
      <thead><tr><th>مقدمہ نمبر</th><th>مدعی</th><th>دفعہ</th><th>صورتحال</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${cases.slice(0,6).map(c=>`<tr>
          <td style="font-weight:800;color:var(--accent);cursor:pointer;font-size:12px;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</td>
          <td style="font-size:11px;">${c.complainant||'—'}</td>
          <td style="font-size:10px;">${c.section_of_law||'—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}" style="font-size:9px;">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:10px;">${formatDate(c.fir_date)}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')" style="font-size:10px;padding:3px 8px;">📄</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`;

  setTimeout(() => { _drawDonut(statusCounts, total); _startIslamicTicker(); }, 150);
}

// ── DONUT CHART ───────────────────────────────────────────────
function _drawDonut(counts, total) {
  const canvas = document.getElementById('dash-donut');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const keys = ['under','complete','incomplete','untrace','cancel'];
  const cx=50, cy=50, r=44, inner=30;
  ctx.clearRect(0,0,100,100);
  if (!total) {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='var(--border)'; ctx.lineWidth=14; ctx.stroke(); return;
  }
  let angle = -Math.PI/2;
  keys.forEach(k => {
    const val=counts[k]||0; if(!val)return;
    const slice=(val/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+slice);
    ctx.closePath(); ctx.fillStyle=_sc(k); ctx.fill();
    angle+=slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#0d2035'; ctx.fill();
}

function _sc(k){ return {under:'#38bdf8',complete:'#22c55e',incomplete:'#f59e0b',untrace:'#a78bfa',cancel:'#ef4444'}[k]||'#888'; }

// ── ISLAMIC TICKER ────────────────────────────────────────────
const _ISLAMIC = [
  '🤲 اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ — درود ابراہیمی پڑھیں',
  '📖 إِنَّ مَعَ الْعُسْرِ يُسْرًا — بے شک تکلیف کے ساتھ آسانی ہے',
  '🤲 سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
  '📖 وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا — جو اللہ سے ڈرے اللہ راستہ دیتا ہے',
  '🤲 اَسْتَغْفِرُاللّٰہَ الْعَظِیْمَ وَاَتُوْبُ اِلَیْہِ',
  '📖 إِنَّ اللَّهَ مَعَ الصَّابِرِينَ — اللہ صبر کرنے والوں کے ساتھ ہے',
  '🤲 لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
  '📖 وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا',
  '🤲 حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ — اللہ ہمارے لیے کافی ہے',
  '📖 فَاذْكُرُونِي أَذْكُرْكُمْ — مجھے یاد کرو میں تمہیں یاد کروں گا',
];
let _islamicIdx = 0;
function _startIslamicTicker() {
  const el = document.getElementById('islamic-ticker');
  if (!el) return;
  el.textContent = _ISLAMIC[0];
  clearInterval(window._islamicTimer);
  window._islamicTimer = setInterval(() => {
    _islamicIdx = (_islamicIdx + 1) % _ISLAMIC.length;
    const el2 = document.getElementById('islamic-ticker');
    if (!el2) { clearInterval(window._islamicTimer); return; }
    el2.style.opacity = '0';
    setTimeout(() => { el2.textContent = _ISLAMIC[_islamicIdx]; el2.style.opacity = '1'; }, 350);
  }, 9000);
}

// ── TRENDS ────────────────────────────────────────────────────
function _monthlyTrend(cases) {
  const now = new Date();
  return Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { label:d.toLocaleString('default',{month:'short'}), count:cases.filter(c=>{ const p=_pd(c.fir_date); return p&&p.startsWith(key); }).length };
  });
}
function _weeklyTrend(cases) {
  const now=new Date();
  return Array.from({length:7},(_,i)=>{
    const d=new Date(now); d.setDate(now.getDate()-6+i);
    const key=d.toISOString().split('T')[0];
    return { label:d.toLocaleString('default',{weekday:'short'}).slice(0,2), isToday:key===now.toISOString().split('T')[0], count:cases.filter(c=>{ const p=_pd(c.fir_date); return p&&p.startsWith(key); }).length };
  });
}
function _pd(d) {
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  return p.length===3&&p[2].length===4?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:null;
}

// ── DATA FETCHERS ─────────────────────────────────────────────
async function _dFetchCourt() {
  const oid=await getOfficerId();
  const{data}=await supabaseClient.from('court_dates').select('*').eq('officer_id',oid).order('hearing_date',{ascending:true});
  return data||[];
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
