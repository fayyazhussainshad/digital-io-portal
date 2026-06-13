/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — COURT DATES TRACKER  (court.js)
   Calendar view · Upcoming hearings · Reminders
   ═══════════════════════════════════════════════════════════ */

registerPage('court', renderCourt);

async function renderCourt(container) {
  container.innerHTML = `<div id="court-root" style="max-width:900px;margin:0 auto;">
    <div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ Loading...</div>
  </div>`;
  await _buildCourt();
}

async function _buildCourt() {
  const root = document.getElementById('court-root');
  if (!root) return;

  const dates = await _loadCourtDates();
  const today = new Date().toISOString().split('T')[0];
  const upcoming = dates.filter(d=>d.hearing_date>=today&&d.status==='pending').sort((a,b)=>a.hearing_date.localeCompare(b.hearing_date));
  const past     = dates.filter(d=>d.hearing_date<today||d.status==='done').sort((a,b)=>b.hearing_date.localeCompare(a.hearing_date));
  const overdue  = dates.filter(d=>d.hearing_date<today&&d.status==='pending');

  root.innerHTML = `
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;display:inline-flex;align-items:center;gap:6px;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">← واپس</button>
    <div>
      <div style="font-size:18px;font-weight:800;">⚖️ عدالتی پیشیاں</div>
      <div style="font-size:12px;color:var(--text-muted);">آنے والی · گزری ہوئی · کیلنڈر</div>
    </div>
    <button class="btn btn-primary" onclick="_openAddCourtDate()">+ پیشی شامل کریں</button>
  </div>

  <!-- Alert: overdue -->
  ${overdue.length ? `
  <div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:10px;padding:12px 16px;margin-bottom:14px;">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:6px;">⚠️ ${overdue.length} پیشیاں گزر گئیں</div>
    ${overdue.map(d=>`<div style="font-size:12px;color:var(--red);">FIR ${d.fir_number||'—'} — ${d.hearing_date} — ${d.court_name||'—'}</div>`).join('')}
  </div>` : ''}

  <!-- Calendar -->
  <div class="card" style="margin-bottom:14px;">
    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;">📅 اس ماہ کی پیشیاں</div>
    ${_renderCalendar(dates)}
  </div>

  <!-- Upcoming -->
  <div class="card" style="margin-bottom:14px;">
    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:12px;">🗓️ آنے والی پیشیاں (${upcoming.length})</div>
    ${upcoming.length ? upcoming.map(d=>_courtCard(d)).join('')
    : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">کوئی آنے والی پیشی نہیں</div>`}
  </div>

  <!-- Past -->
  ${past.length ? `
  <div class="card">
    <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:12px;">📋 گزشتہ پیشیاں (${past.length})</div>
    ${past.slice(0,10).map(d=>_courtCard(d,true)).join('')}
  </div>` : ''}`;
}

// ── CALENDAR ──────────────────────────────────────────────────
function _renderCalendar(dates) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year,month,1).getDay();
  const days  = new Date(year,month+1,0).getDate();
  const today = now.getDate();
  const monthName = now.toLocaleString('default',{month:'long',year:'numeric'});

  // Map dates to day numbers
  const dateMap = {};
  dates.forEach(d=>{
    const dt = new Date(d.hearing_date);
    if(dt.getFullYear()===year&&dt.getMonth()===month){
      const day=dt.getDate();
      if(!dateMap[day])dateMap[day]=[];
      dateMap[day].push(d);
    }
  });

  let html = `<div style="text-align:center;font-size:13px;font-weight:700;margin-bottom:10px;">${monthName}</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;direction:rtl;text-align:center;">`;
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{
    html+=`<div style="font-size:10px;color:var(--text-faint);padding:3px;">${d}</div>`;
  });
  // Empty cells
  for(let i=0;i<first;i++) html+=`<div></div>`;
  // Day cells
  for(let d=1;d<=days;d++){
    const isToday=d===today;
    const hasDates=dateMap[d];
    html+=`<div style="padding:4px 2px;border-radius:6px;min-height:32px;
      background:${isToday?'var(--accent)':hasDates?'rgba(56,189,248,0.1)':'transparent'};
      border:1px solid ${isToday?'var(--accent)':hasDates?'var(--accent)':'transparent'};">
      <div style="font-size:12px;font-weight:${isToday?'800':'400'};color:${isToday?'#fff':hasDates?'var(--accent)':'var(--text-secondary)'};">${d}</div>
      ${hasDates?`<div style="font-size:8px;color:${isToday?'#fff':'var(--accent)'};">${hasDates.length} پیشی</div>`:''}
    </div>`;
  }
  html+=`</div>`;
  return html;
}

// ── COURT CARD ────────────────────────────────────────────────
function _courtCard(d, isPast=false) {
  const dt   = new Date(d.hearing_date);
  const diff = Math.ceil((dt-new Date())/(1000*60*60*24));
  const urgency = !isPast && diff<=3 ? 'var(--red)' : !isPast && diff<=7 ? 'var(--amber)' : 'var(--accent)';
  return `
  <div style="display:flex;gap:10px;padding:10px;background:${isPast?'var(--bg-tertiary)':'var(--bg-secondary)'};border-radius:8px;margin-bottom:8px;border:1px solid ${isPast?'var(--border)':urgency};opacity:${isPast?'0.7':'1'};">
    <div style="background:${urgency};color:#fff;border-radius:8px;padding:6px 10px;text-align:center;flex-shrink:0;min-width:44px;">
      <div style="font-size:18px;font-weight:900;line-height:1;">${dt.getDate()}</div>
      <div style="font-size:9px;">${dt.toLocaleString('default',{month:'short'})}</div>
    </div>
    <div style="flex:1;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:700;color:var(--accent);">FIR ${d.fir_number||'—'}</span>
        ${!isPast&&diff<=3?`<span style="font-size:10px;background:var(--red);color:#fff;padding:1px 6px;border-radius:8px;">${diff===0?'آج':diff<0?'گزر گئی':diff+'  دن باقی'}</span>`:''}
        <span class="pill ${d.status==='done'?'pill-green':'pill-blue'}" style="font-size:10px;">${d.status==='done'?'مکمل':'زیر التواء'}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">⚖️ ${d.court_name||'—'} &nbsp;·&nbsp; 🕐 ${d.hearing_time||'—'}</div>
      ${d.judge_name?`<div style="font-size:11px;color:var(--text-muted);">جج: ${d.judge_name}</div>`:''}
      ${d.purpose?`<div style="font-size:11px;color:var(--text-muted);">مقصد: ${d.purpose}</div>`:''}
      ${d.notes?`<div style="font-size:11px;color:var(--text-faint);">${d.notes}</div>`:''}
    </div>
    <div style="display:flex;flex-direction:column;gap:4px;">
      <button class="btn btn-secondary btn-sm" onclick="_editCourtDate('${d.id}')">✏️</button>
      ${!isPast?`<button class="btn btn-secondary btn-sm" onclick="_markCourtDone('${d.id}')">✅</button>`:''}
      <button class="btn btn-danger btn-sm" onclick="_deleteCourtDate('${d.id}')">🗑️</button>
    </div>
  </div>`;
}

// ── ADD / EDIT ────────────────────────────────────────────────
async function _openAddCourtDate(existing) {
  // Load cases for dropdown
  const cases = await getCases().catch(()=>[]);
  const e = existing || {};

  openModal(existing ? '✏️ پیشی تبدیل کریں' : '+ نئی پیشی شامل کریں', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;direction:rtl;">
      <div>
        <label class="form-label">FIR نمبر</label>
        <select class="form-input" id="cd-fir">
          <option value="">-- FIR منتخب کریں --</option>
          ${cases.map(c=>`<option value="${c.fir_number}" data-id="${c.id}" ${e.fir_number===c.fir_number?'selected':''}>${c.fir_number} — ${c.complainant||'—'}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">پیشی کی تاریخ *</label>
        <input class="form-input" type="date" id="cd-date" value="${e.hearing_date||''}">
      </div>
      <div>
        <label class="form-label">پیشی کا وقت</label>
        <input class="form-input" type="time" id="cd-time" value="${e.hearing_time||''}">
      </div>
      <div>
        <label class="form-label">عدالت کا نام *</label>
        <input class="form-input" id="cd-court" placeholder="e.g. سیشن کورٹ ملتان" value="${e.court_name||''}">
      </div>
      <div>
        <label class="form-label">جج کا نام</label>
        <input class="form-input" id="cd-judge" placeholder="جج کا نام" value="${e.judge_name||''}">
      </div>
      <div>
        <label class="form-label">پیشی کا مقصد</label>
        <select class="form-input" id="cd-purpose">
          ${['شہادت','دلائل','فیصلہ','ضمانت','ریمانڈ','چالان','دیگر'].map(p=>`<option ${e.purpose===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="margin-top:10px;">
      <label class="form-label">نوٹس</label>
      <textarea class="form-input" id="cd-notes" rows="2" placeholder="کوئی خاص ہدایت...">${e.notes||''}</textarea>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="_saveCourtDate('${existing?.id||''}')">💾 محفوظ کریں</button>`
  );
}

async function _saveCourtDate(existingId) {
  const firSel = document.getElementById('cd-fir');
  const firNum = firSel?.value || '';
  const caseId = firSel?.selectedOptions[0]?.dataset.id || null;
  const date   = document.getElementById('cd-date')?.value;
  const court  = document.getElementById('cd-court')?.value.trim();
  if (!date) { showToast('⚠️ تاریخ درج کریں','error'); return; }
  if (!court) { showToast('⚠️ عدالت کا نام درج کریں','error'); return; }

  const payload = {
    fir_number:   firNum,
    case_id:      caseId,
    hearing_date: date,
    hearing_time: document.getElementById('cd-time')?.value||'',
    court_name:   court,
    judge_name:   document.getElementById('cd-judge')?.value.trim()||'',
    purpose:      document.getElementById('cd-purpose')?.value||'',
    notes:        document.getElementById('cd-notes')?.value.trim()||'',
    status:       'pending',
  };

  try {
    const oid = await getOfficerId();
    if (existingId) {
      await supabaseClient.from('court_dates').update(payload).eq('id',existingId);
    } else {
      payload.officer_id = oid;
      await supabaseClient.from('court_dates').insert(payload);
    }
    closeModal();
    showToast('✅ پیشی محفوظ ہو گئی','success');
    const c = document.getElementById('page-content');
    if (c) renderCourt(c);
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _editCourtDate(id) {
  const { data } = await supabaseClient.from('court_dates').select('*').eq('id',id).single();
  if (data) _openAddCourtDate(data);
}

async function _markCourtDone(id) {
  await supabaseClient.from('court_dates').update({status:'done'}).eq('id',id);
  showToast('✅ پیشی مکمل','success');
  const c=document.getElementById('page-content'); if(c)renderCourt(c);
}

async function _deleteCourtDate(id) {
  await supabaseClient.from('court_dates').delete().eq('id',id);
  showToast('🗑️ پیشی ہٹا دی گئی','info');
  const c=document.getElementById('page-content'); if(c)renderCourt(c);
}

async function _loadCourtDates() {
  const oid=await getOfficerId();
  const{data}=await supabaseClient.from('court_dates').select('*').eq('officer_id',oid).order('hearing_date',{ascending:true});
  return data||[];
}
