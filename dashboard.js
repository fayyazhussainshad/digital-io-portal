/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v3  (dashboard.js)
   Live stats · Donut chart · Bar charts · Quick actions
   Islamic ticker · Court + Reminders preview
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  container.innerHTML = `<div id="dash-root" style="max-width:960px;margin:0 auto;padding:4px 0;">
    <div style="text-align:center;padding:30px;color:var(--text-muted);">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>ڈیش بورڈ لوڈ ہو رہا ہے...
    </div>
  </div>`;
  await _buildDashboard();
}

async function _buildDashboard() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  const [cases, courtDates, reminders, patrolCount] = await Promise.all([
    getCases().catch(()=>[]),
    _dbFetch('court_dates').catch(()=>[]),
    _dbFetch('reminders',{is_done:false}).catch(()=>[]),
    _dbCount('patrol_logs').catch(()=>0),
  ]);

  const today    = new Date().toISOString().split('T')[0];
  const total    = cases.length;
  const active   = cases.filter(c=>c.status==='under').length;
  const complete = cases.filter(c=>c.status==='complete').length;
  const untrace  = cases.filter(c=>c.status==='untrace').length;
  const upcoming = courtDates.filter(d=>d.hearing_date>=today&&d.status==='pending')
                             .sort((a,b)=>a.hearing_date.localeCompare(b.hearing_date));
  const overdue  = courtDates.filter(d=>d.hearing_date<today&&d.status==='pending');
  const pendRem  = reminders.filter(r=>!r.is_done);
  const overdueRem = pendRem.filter(r=>r.reminder_date&&r.reminder_date<today);

  const statusCounts = {};
  cases.forEach(c=>{statusCounts[c.status]=(statusCounts[c.status]||0)+1;});
  const monthly = _getMonthly(cases);
  const weekly  = _getWeekly(cases);

  root.innerHTML = `
  <!-- Islamic Ticker -->
  <div id="islamic-ticker-bar" style="background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:7px 16px;margin-bottom:12px;text-align:center;direction:rtl;cursor:pointer;" onclick="_nextIslamicMsg()">
    <span id="islamic-msg" style="font-size:14px;color:var(--accent);font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-weight:600;"></span>
  </div>

  <!-- Welcome -->
  <div style="background:linear-gradient(135deg,#0d2a45 0%,#1a3a5c 60%,#1e4976 100%);border-radius:14px;padding:18px 22px;margin-bottom:14px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-30px;left:-20px;width:140px;height:140px;border-radius:50%;background:rgba(56,189,248,0.06);pointer-events:none;"></div>
    <div style="display:flex;align-items:center;gap:14px;position:relative;direction:rtl;">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 14px rgba(56,189,248,0.4);">
        ${(o.full_name||'IO').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:#fff;font-family:'Jameel Noori Nastaleeq',serif;">خوش آمدید، ${o.full_name||'Officer'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65);">${o.designation||''} · تھانہ ${o.station||''} · ضلع ${o.district||''}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;" id="dash-clock">${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
        ${overdue.length?`<div style="background:#ef4444;color:#fff;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;">⚠️ ${overdue.length} پیشی گزری</div>`:''}
        ${overdueRem.length?`<div style="background:var(--amber);color:#000;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;">🔔 ${overdueRem.length} یاددہانی</div>`:''}
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
    ${[
      {l:'کل مقدمات',v:total,i:'📁',c:'var(--accent)',s:total?'مجموعی':'ابھی نہیں'},
      {l:'زیر تفتیش',v:active,i:'🔍',c:'var(--amber)',s:total?Math.round(active/total*100)+'%':'0%'},
      {l:'مکمل',v:complete,i:'✅',c:'var(--green)',s:total?Math.round(complete/total*100)+'%':'0%'},
      {l:'پیشیاں',v:upcoming.length,i:'⚖️',c:'#a78bfa',s:overdue.length?overdue.length+' گزری':'صاف'},
    ].map(s=>`
      <div onclick="${s.l==='کل مقدمات'?"showPage('cases',document.querySelector('.nav-item[onclick*=cases]'))"
                    :s.l==='پیشیاں'?"showPage('reminders',document.querySelector('.nav-item[onclick*=reminders]'))"
                    :"_filterDashCases('"+s.l+"')"}"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 12px;cursor:pointer;position:relative;overflow:hidden;transition:transform 0.15s;"
        onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
        <div style="position:absolute;top:-10px;right:-8px;font-size:42px;opacity:0.07;">${s.i}</div>
        <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:5px;direction:rtl;">${s.l}</div>
        <div style="font-size:28px;font-weight:900;color:${s.c};line-height:1;">${s.v}</div>
        <div style="font-size:9px;color:var(--text-faint);margin-top:3px;">${s.s}</div>
      </div>`).join('')}
  </div>

  <!-- Quick Actions -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;direction:rtl;">
    ${[
      ['📁','میرے مقدمات','cases'],
      ['+ اندراج','نیا مقدمہ','new_case'],
      ['⚖️','یاددہانیاں','reminders'],
      ['🚔','گشت','patrol'],
      ['🚨','واقعاتی','incident'],
    ].map(([i,l,p])=>`
      <button onclick="${p==='new_case'?'openAddCaseModal()':`showPage('${p}',document.querySelector('.nav-item[onclick*=${p}]'))`}"
        class="btn btn-secondary" style="font-size:11px;padding:8px 6px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
        ${i} ${l}
      </button>`).join('')}
  </div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:5fr 7fr;gap:12px;margin-bottom:14px;">

    <!-- Donut -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">📊 مقدمات کی صورتحال</div>
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="position:relative;flex-shrink:0;">
          <canvas id="dash-donut" width="100" height="100"></canvas>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;">
            <div style="font-size:18px;font-weight:900;color:var(--text-primary);">${total}</div>
            <div style="font-size:8px;color:var(--text-muted);">کل</div>
          </div>
        </div>
        <div style="flex:1;">
          ${Object.entries({under:'زیر تفتیش',complete:'مکمل',incomplete:'نامکمل',untrace:'عدم پتہ',cancel:'اخراج'}).map(([k,l])=>`
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;direction:rtl;">
            <div style="width:8px;height:8px;border-radius:50%;background:${_sc(k)};flex-shrink:0;"></div>
            <div style="font-size:10px;color:var(--text-secondary);flex:1;">${l}</div>
            <div style="font-size:12px;font-weight:700;color:${_sc(k)};">${statusCounts[k]||0}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Monthly Bar -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">📈 ماہانہ اندراج</div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:6px;">
        ${monthly.map((m,i)=>{
          const max=Math.max(...monthly.map(x=>x.count),1);
          const h=Math.round(m.count/max*72);
          const isLast=i===monthly.length-1;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
            ${m.count?`<div style="font-size:8px;color:${isLast?'var(--accent)':'var(--text-faint)'};">${m.count}</div>`:'<div style="font-size:8px;"></div>'}
            <div style="width:100%;background:${isLast?'var(--accent)':'rgba(56,189,248,0.3)'};border-radius:3px 3px 0 0;height:${Math.max(h,2)}px;"></div>
            <div style="font-size:8px;color:${isLast?'var(--accent)':'var(--text-faint)'};">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
      <!-- Weekly mini bars -->
      <div style="border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:4px;direction:rtl;">ہفتہ وار</div>
        <div style="display:flex;align-items:flex-end;gap:3px;height:30px;">
          ${weekly.map(d=>{
            const max=Math.max(...weekly.map(x=>x.count),1);
            const h=Math.round(d.count/max*24);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;" title="${d.label}: ${d.count}">
              <div style="width:100%;background:${d.isToday?'var(--green)':'rgba(34,197,94,0.3)'};border-radius:2px 2px 0 0;height:${Math.max(h,1)}px;"></div>
              <div style="font-size:7px;color:${d.isToday?'var(--green)':'var(--text-faint)'};">${d.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- Performance + Court Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">

    <!-- Progress bars -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">🎯 کارکردگی</div>
      ${[
        {l:'تکمیل شرح', v:total?Math.round(complete/total*100):0, c:'var(--green)'},
        {l:'زیر تفتیش', v:total?Math.round(active/total*100):0,   c:'var(--amber)'},
        {l:'عدم پتہ',   v:total?Math.round(untrace/total*100):0,  c:'#a78bfa'},
      ].map(r=>`
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-secondary);margin-bottom:3px;direction:rtl;">
            <span>${r.l}</span><span style="font-weight:700;color:${r.c};">${r.v}%</span>
          </div>
          <div style="background:var(--bg-tertiary);border-radius:4px;overflow:hidden;height:6px;">
            <div style="background:${r.c};height:100%;width:${r.v}%;border-radius:4px;transition:width 0.6s;"></div>
          </div>
        </div>`).join('')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
        <div style="background:var(--bg-secondary);border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:18px;font-weight:900;color:var(--accent);">${patrolCount}</div>
          <div style="font-size:9px;color:var(--text-muted);">🚔 گشت</div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:18px;font-weight:900;color:var(--amber);">${pendRem.length}</div>
          <div style="font-size:9px;color:var(--text-muted);">🔔 یاددہانی</div>
        </div>
      </div>
    </div>

    <!-- Upcoming court + reminders -->
    <div class="card">
      <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:10px;display:flex;justify-content:space-between;direction:rtl;">
        <span>⚖️ آنے والی پیشیاں (${upcoming.length})</span>
        <button class="btn btn-secondary btn-sm" style="font-size:9px;padding:2px 8px;" onclick="showPage('reminders',document.querySelector('.nav-item[onclick*=reminders]'))">سب →</button>
      </div>
      ${upcoming.slice(0,3).map(d=>{
        const dt=new Date(d.hearing_date);
        const diff=Math.ceil((dt-new Date())/(1000*60*60*24));
        const urg=diff<=3?'var(--red)':diff<=7?'var(--amber)':'var(--accent)';
        return `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);align-items:center;direction:rtl;">
          <div style="background:${urg};color:#fff;border-radius:5px;padding:3px 7px;text-align:center;flex-shrink:0;">
            <div style="font-size:13px;font-weight:800;line-height:1;">${dt.getDate()}</div>
            <div style="font-size:7px;">${dt.toLocaleString('default',{month:'short'})}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;font-weight:600;">FIR ${d.fir_number||'—'}</div>
            <div style="font-size:9px;color:var(--text-muted);">${d.court_name||'—'}</div>
          </div>
          ${diff<=3?`<span style="font-size:9px;background:${urg};color:#fff;padding:1px 5px;border-radius:6px;">${diff===0?'آج':diff<0?'گزری':diff+'d'}</span>`:''}
        </div>`;
      }).join('') || `<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:11px;">✅ کوئی پیشی نہیں</div>`}
      ${overdue.length?`<div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:6px;padding:6px 8px;margin-top:6px;font-size:10px;color:var(--red);font-weight:700;direction:rtl;">⚠️ ${overdue.length} پیشیاں گزر گئیں</div>`:''}
    </div>
  </div>

  <!-- Recent Cases -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;direction:rtl;">
      <div style="font-size:11px;font-weight:700;color:var(--accent);">📁 حالیہ مقدمات</div>
      <button class="btn btn-secondary btn-sm" style="font-size:9px;" onclick="showPage('cases',document.querySelector('.nav-item[onclick*=cases]'))">سب →</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>مقدمہ نمبر</th><th>مدعی</th><th>دفعہ</th><th>صورتحال</th><th>تاریخ</th><th></th></tr></thead>
      <tbody>
        ${cases.slice(0,6).map(c=>`<tr>
          <td style="font-weight:800;color:var(--accent);cursor:pointer;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</td>
          <td style="font-size:11px;">${c.complainant||'—'}</td>
          <td style="font-size:10px;">${c.section_of_law||'—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}" style="font-size:9px;">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:10px;">${formatDate(c.fir_date)}</td>
          <td><button class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:10px;" onclick="openCaseWorkspace('${c.id}')">📄</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>`;

  // Draw donut + start ticker
  setTimeout(()=>{ _drawDonut(statusCounts,total); _startTicker(); }, 150);
}

// ── DONUT ─────────────────────────────────────────────────────
function _drawDonut(counts,total) {
  const cv=document.getElementById('dash-donut'); if(!cv)return;
  const ctx=cv.getContext('2d');
  const cx=50,cy=50,r=42,ri=26;
  ctx.clearRect(0,0,100,100);
  if(!total){ ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='var(--border)';ctx.lineWidth=16;ctx.stroke();return; }
  let angle=-Math.PI/2;
  ['under','complete','incomplete','untrace','cancel'].forEach(k=>{
    const v=counts[k]||0; if(!v)return;
    const slice=(v/total)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
    ctx.fillStyle=_sc(k);ctx.fill();angle+=slice;
  });
  ctx.beginPath();ctx.arc(cx,cy,ri,0,Math.PI*2);
  ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bg-card')||'#0d1b2e';
  ctx.fill();
}
function _sc(k){return{under:'#38bdf8',complete:'#22c55e',incomplete:'#f59e0b',untrace:'#a78bfa',cancel:'#ef4444'}[k]||'#888';}

// ── ISLAMIC TICKER ────────────────────────────────────────────
const _MSGS=[
  '🤲 اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ — درود ابراہیمی پڑھیں',
  '📖 إِنَّ مَعَ الْعُسْرِ يُسْرًا — بے شک تکلیف کے ساتھ آسانی ہے',
  '🤲 سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
  '📖 وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا — اللہ سے ڈرو وہ راستہ نکالے گا',
  '🤲 اَسْتَغْفِرُاللّٰہَ الْعَظِیْم — اللہ سے معافی مانگیں',
  '📖 وَتَوَكَّلْ عَلَى اللَّهِ — اللہ پر توکل کریں',
  '🤲 لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ',
  '📖 إِنَّ اللَّهَ مَعَ الصَّابِرِينَ — اللہ صبر کرنے والوں کے ساتھ ہے',
  '🤲 حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ — اللہ ہمارے لیے کافی ہے',
  '📖 فَاذْكُرُونِي أَذْكُرْكُمْ — مجھے یاد کرو میں تمہیں یاد کروں گا',
];
let _msgIdx=0,_tickerTimer=null;
function _startTicker(){
  const el=document.getElementById('islamic-msg'); if(!el)return;
  el.textContent=_MSGS[_msgIdx];
  if(_tickerTimer)clearInterval(_tickerTimer);
  _tickerTimer=setInterval(()=>{
    const e=document.getElementById('islamic-msg'); if(!e)return;
    e.style.opacity='0';
    setTimeout(()=>{
      _msgIdx=(_msgIdx+1)%_MSGS.length;
      const e2=document.getElementById('islamic-msg'); if(!e2)return;
      e2.textContent=_MSGS[_msgIdx]; e2.style.opacity='1';
    },400);
  },8000);
}
function _nextIslamicMsg(){
  const el=document.getElementById('islamic-msg'); if(!el)return;
  el.style.opacity='0';
  setTimeout(()=>{
    _msgIdx=(_msgIdx+1)%_MSGS.length;
    const e=document.getElementById('islamic-msg'); if(!e)return;
    e.textContent=_MSGS[_msgIdx]; e.style.opacity='1';
  },300);
}

// ── DATA HELPERS ──────────────────────────────────────────────
async function _dbFetch(table,match){
  const oid=await getOfficerId();
  let q=supabaseClient.from(table).select('*').eq('officer_id',oid);
  if(match)Object.entries(match).forEach(([k,v])=>{ q=q.eq(k,v); });
  const{data}=await q; return data||[];
}
async function _dbCount(table){
  const oid=await getOfficerId();
  const{count}=await supabaseClient.from(table).select('*',{count:'exact',head:true}).eq('officer_id',oid);
  return count||0;
}
function _getMonthly(cases){
  const now=new Date();
  return Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label=d.toLocaleString('default',{month:'short'});
    const count=cases.filter(c=>{const p=_pd(c.fir_date);return p&&p.startsWith(key);}).length;
    return{key,label,count};
  });
}
function _getWeekly(cases){
  const now=new Date();
  return Array.from({length:7},(_,i)=>{
    const d=new Date(now); d.setDate(now.getDate()-6+i);
    const key=d.toISOString().split('T')[0];
    const isToday=key===now.toISOString().split('T')[0];
    const label=d.toLocaleString('default',{weekday:'short'}).slice(0,2);
    const count=cases.filter(c=>{const p=_pd(c.fir_date);return p&&p.startsWith(key);}).length;
    return{key,label,count,isToday};
  });
}
function _pd(d){
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  if(p.length===3&&p[2].length===4)return`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return null;
}
function _filterDashCases(label){
  showPage('cases',document.querySelector('.nav-item[onclick*=cases]'));
}
