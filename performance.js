/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — PERFORMANCE STATS  v2  (performance.js)
   Real data · Charts · Monthly trends · Comparison
   ═══════════════════════════════════════════════════════════ */

registerPage('performance', renderPerformance);

async function renderPerformance(container) {
  const _loading = (window.DIO && DIO.states) ? DIO.states.loading('کارکردگی رپورٹ لوڈ ہو رہی ہے') : '<div style="text-align:center;padding:20px;color:var(--text-muted);">لوڈ ہو رہا ہے...</div>';
  container.innerHTML = `<div id="perf-root" style="max-width:none;">${_loading}</div>`;
  await _buildPerf();
}

async function _buildPerf() {
  const root = document.getElementById('perf-root');
  if (!root) return;

  // v540: یاددہانیاں یہاں منگوائی جاتی تھیں مگر کارکردگی میں کہیں استعمال نہیں — فالتو درخواست ہٹا دی
  const [cases, courtDates] = await Promise.all([
    getCases().catch(()=>[]),
    _perfCourtDates().catch(()=>[]),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const total      = cases.length;
  const complete   = cases.filter(c=>c.status==='complete').length;
  const incomplete = cases.filter(c=>c.status==='incomplete').length;
  const under      = cases.filter(c=>c.status==='under').length;
  const untrace    = cases.filter(c=>c.status==='untrace').length;
  const cancel     = cases.filter(c=>c.status==='cancel').length;
  const c512       = cases.filter(c=>c.status==='challan512').length;
  const overdueC   = courtDates.filter(d=>d.status==='pending'&&d.hearing_date<today).length;
  const complRate  = total ? Math.round(complete/total*100) : 0;

  const monthly    = _perfMonthly(cases);
  const bySection  = _perfBySection(cases);
  const usage      = typeof getUsageStats === 'function' ? getUsageStats() : [];

  root.innerHTML = `
  <!-- Back + Header -->
  <div class="page-header">
    <div>
      <div class="page-title">کارکردگی کا جائزہ</div>
      <div class="page-subtitle">${esc(currentOfficer?.full_name||'')} · ${esc(currentOfficer?.station||'')} · ${formatDate(new Date())}</div>
    </div>
  </div>

  <!-- Score Card -->
  <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:14px;padding:18px;margin-bottom:14px;direction:rtl;">
    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:6px;">مجموعی تکمیل شرح</div>
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:48px;font-weight:900;color:${complRate>=70?'#22c55e':complRate>=40?'#f59e0b':'#ef4444'};">${complRate}%</div>
      <div style="flex:1;">
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;overflow:hidden;height:12px;margin-bottom:8px;">
          <div style="background:${complRate>=70?'#22c55e':complRate>=40?'#f59e0b':'#ef4444'};height:100%;width:${complRate}%;border-radius:8px;transition:width 0.8s;"></div>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);">
          ${complete} مکمل / ${total} کل مقدمات
          ${complRate>=70?'شاباش':''}${complRate>=40&&complRate<70?'اچھا':''}${complRate<40?'بہتری کی ضرورت':''}
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
    ${[
      {l:'چالان مکمل',   v:complete,   c:'var(--green)', i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M4.5 12.5l5 5 10-11'/></svg>"},
      {l:'زیر تفتیش',   v:under,      c:'var(--accent)',i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg>"},
      {l:'عدم پتہ',      v:untrace,    c:'#a78bfa',     i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='12' cy='12' r='8.5'/><path d='M9.5 9.5a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2-2.5 3.6'/><path d='M12 17.4h.01'/></svg>"},
      {l:'اخراج',        v:cancel,     c:'var(--red)',   i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6 6l12 12'/><path d='M18 6L6 18'/></svg>"},
      {l:'چالان نامکمل', v:incomplete, c:'var(--amber)', i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M12 4L3 19.5h18z'/><path d='M12 10v4.5'/><path d='M12 17.2h.01'/></svg>"},
      {l:'چالان 512',    v:c512,       c:'#f97316',     i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M8 4h8v3H8z'/><path d='M9 4H6v17h12V4h-3'/><path d='M9 11h6'/><path d='M9 15h6'/></svg>"},
      {l:'گزشتہ پیشیاں',  v:overdueC,  c:'var(--red)',   i:"<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M12 4v16'/><path d='M6 20h12'/><path d='M4 9l3-4 3 4'/><path d='M14 9l3-4 3 4'/></svg>"},
    ].map(s=>`
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 8px;text-align:center;border-right:3px solid ${s.c};">
      <div style="font-size:16px;">${s.i}</div>
      <div style="font-size:22px;font-weight:900;color:${s.c};">${s.v}</div>
      <div style="font-size:9px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">${s.l}</div>
    </div>`).join('')}
  </div>

  <!-- Charts Row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">

    <!-- Monthly trend -->
    <div class="card">
      <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">ماہانہ اندراج (12 ماہ)</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:90px;margin-bottom:6px;">
        ${monthly.map((m,i)=>{
          const max=Math.max(...monthly.map(x=>x.count),1);
          const pct=Math.round(m.count/max*100);
          const isCur=i===monthly.length-1;
          return `<div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;" title="${m.label}: ${m.count}">
            ${m.count?`<div style="font-size:7px;color:${isCur?'var(--accent)':'var(--text-faint)'};font-weight:${isCur?'800':'400'};">${m.count}</div>`:'<div style="font-size:7px;"></div>'}
            <div style="width:100%;background:${isCur?'var(--accent)':'rgba(56,189,248,0.3)'};border-radius:2px 2px 0 0;height:${Math.max(pct*0.75,2)}px;"></div>
            <div style="font-size:6px;color:${isCur?'var(--accent)':'var(--text-faint)'};">${m.label}</div>
          </div>`;}).join('')}
      </div>
    </div>

    <!-- Section breakdown -->
    <div class="card">
      <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">اہم دفعات</div>
      ${bySection.slice(0,5).map(s=>`
      <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;direction:rtl;">
        <div style="font-size:10px;font-family:monospace;color:var(--accent);min-width:70px;">${esc(s.section)}</div>
        <div style="flex:1;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;height:8px;">
          <div style="background:var(--accent);height:100%;width:${Math.round(s.count/Math.max(...bySection.map(x=>x.count))*100)}%;"></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--text-secondary);min-width:20px;">${s.count}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- Button Usage Stats -->
  ${usage.length ? `
  <div class="card" style="margin-bottom:14px;">
    <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">سب سے زیادہ استعمال ہونے والے بٹن</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
      ${usage.slice(0,9).map((u,i)=>`
      <div style="background:var(--bg-secondary);border-radius:8px;padding:8px;direction:rtl;border-right:3px solid ${i<3?'var(--accent)':'var(--border)'};">
        <div style="font-size:11px;font-weight:700;color:${i<3?'var(--accent)':'var(--text-secondary)'};">${u.count}x</div>
        <div style="font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(u.label)}</div>
      </div>`).join('')}
    </div>
    <div style="text-align:center;margin-top:8px;">
      <button class="btn btn-secondary btn-sm" onclick="_clearUsageStats()">گنتی دوبارہ شروع کریں</button>
    </div>
  </div>` : ''}

  <!-- Print Report -->
  <div style="text-align:left;margin-top:4px;">
    <button class="btn btn-primary" onclick="_printPerfReport()">کارکردگی رپورٹ پرنٹ کریں</button>
  </div>`;
}

// ── DATA HELPERS ──────────────────────────────────────────────
function _perfMonthly(cases) {
  const now = new Date();
  return Array.from({length:12},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-11+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    // Maheene ka naam Urdu mein — `toLocaleString` browser ki zaban
    // par chhoR deta tha, jis se safhe par "Sep Aug Jul…" aa jata tha.
    /* Chhote naam: 12 maheene aik satar mein aate hain. Poore Urdu
       naam ("جولائی", "ستمبر") angrezi ke 3-harfi naamon se chauRe
       hain — phone par baarah khane sakreen se bahar nikal jate the. */
    const _UR=['جنو','فرو','مار','اپر','مئی','جون','جول','اگس','ستم','اکت','نوم','دسم'];
    const lbl=_UR[d.getMonth()];
    const count=cases.filter(c=>{ const p=_ppd(c.fir_date); return p&&p.startsWith(key); }).length;
    return {label:lbl,count};
  });
}
function _perfBySection(cases) {
  const map={};
  cases.forEach(c=>{
    const sec=(c.section_of_law||'').split(/[,\/،]/)[0].trim().slice(0,15);
    if(sec) map[sec]=(map[sec]||0)+1;
  });
  return Object.entries(map).map(([section,count])=>({section,count})).sort((a,b)=>b.count-a.count);
}
function _ppd(d) {
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  return p.length===3&&p[2].length===4?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:null;
}
async function _perfCourtDates() {
  const oid=await getOfficerId();
  const{data}=await supabaseClient.from('court_dates').select('*').eq('officer_id',oid);
  return data||[];
}

function _clearUsageStats() {
  try { localStorage.removeItem('dio_btn_usage'); showToast('گنتی صاف ہو گئی۔','info'); _buildPerf(); } catch(_) {}
}

function _printPerfReport() {
  const o=currentOfficer||{};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>@page{margin:20mm;}body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;font-size:13px;color:#111;}
    h2,h3{text-align:center;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ccc;padding:6px 10px;}
    th{background:#f0f0f0;}.footer{font-size:10px;color:#888;text-align:left;margin-top:20px;border-top:1px solid #ccc;padding-top:8px;direction:ltr;}</style>
    </head><body>
    <h2>کارکردگی رپورٹ</h2>
    <h3>${esc(o.full_name)||'—'} · ${esc(o.designation)||''} · تھانہ ${esc(o.station)||'—'}</h3>
    <p style="text-align:center;">تاریخ: ${formatDate(new Date())}</p>
    <table>
      <tr><th>چالان مکمل</th><th>زیر تفتیش</th><th>عدم پتہ</th><th>اخراج</th><th>کل</th></tr>
      <tr id="pr-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
    </table>
    <div class="footer">Digital IO</div>
    <script>
    window.onload = function() {
      // Will be populated after print
      
    };
    <\/script></body></html>`);
  dioPrint(_printHTML);
}
