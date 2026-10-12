/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — REMINDERS  (reminders.js)
   Urdu UI · Auto reminders · Court dates merged · Manual add
   ═══════════════════════════════════════════════════════════ */

registerPage('reminders', renderReminders);

async function renderReminders(container) {
  // Phase 3C — DIO.states.loading()
  const _loadingHtml = (window.DIO && DIO.states)
    ? DIO.states.loading('یاددہانیاں لوڈ ہو رہی ہیں')
    : `<div style="text-align:center;padding:20px;color:var(--text-muted);">لوڈ ہو رہا ہے...</div>`;
  container.innerHTML = `<div id="rem-root">${_loadingHtml}</div>`;
  await _buildReminders();
}

async function _buildReminders() {
  const root = document.getElementById('rem-root');
  if (!root) return;

  const today = new Date().toISOString().split('T')[0];
  const [reminders, courtDates] = await Promise.all([
    getReminders().catch(()=>[]),
    _remGetCourtDates().catch(()=>[]),
  ]);

  // Merge court dates as reminder-like objects
  const courtAsRem = courtDates
    .filter(d => d.status === 'pending')
    .map(d => ({
      id: 'court_' + d.id,
      _isCourtDate: true,
      _courtId: d.id,
      text: `عدالتی پیشی — FIR ${d.fir_number||'—'} · ${d.court_name||'—'}${d.hearing_time?' · '+d.hearing_time:''}${d.purpose?' · '+d.purpose:''}`,
      reminder_date: d.hearing_date,
      is_done: false,
      priority: _courtUrgency(d.hearing_date, today),
    }));

  const all = [...reminders, ...courtAsRem]
    .sort((a,b) => (a.reminder_date||'').localeCompare(b.reminder_date||''));

  const overdue   = all.filter(r => !r.is_done && r.reminder_date && r.reminder_date < today);
  const upcoming  = all.filter(r => !r.is_done && (!r.reminder_date || r.reminder_date >= today));
  const done      = all.filter(r => r.is_done);

  root.innerHTML = `
  <!-- Header -->
  <!-- AHEM: pehle yahan do <div> khulte the magar sirf aik band hota tha,
       is liye poora safha header ki flex row me chala jata tha (cards
       aik hi qatar me chipak jate the). Ab saaf tarkeeb: aik header. -->
  <div class="page-header">
    <div>
      <div class="page-title">یاددہانیاں</div>
      <div class="page-subtitle">خودکار · عدالتی پیشیاں · دستی</div>
    </div>
    <button class="btn btn-primary dio-add-btn" onclick="_openAddReminder()">+ نئی یاددہانی</button>
  </div>

  <!-- Overdue Alert -->
  ${overdue.length ? `
  <div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px;">گزری ہوئی یاددہانیاں (${overdue.length})</div>
    ${overdue.map(r => _remCard(r, true)).join('')}
  </div>` : ''}

  <!-- Upcoming -->
  <div class="card" style="margin-bottom:12px;">
    <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">آنے والی یاددہانیاں (${upcoming.length})</div>
    ${upcoming.length ? upcoming.map(r => _remCard(r, false)).join('')
    : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">کوئی یاددہانی نہیں</div>`}
  </div>

  <!-- Done -->
  ${done.length ? `
  <details>
    <summary style="cursor:pointer;font-size:12px;color:var(--text-muted);padding:8px 0;">مکمل یاددہانیاں (${done.length})</summary>
    <div class="card" style="margin-top:8px;opacity:0.7;">
      ${done.slice(0,10).map(r => _remCard(r, false, true)).join('')}
    </div>
  </details>` : ''}`;
}

function _courtUrgency(date, today) {
  const diff = Math.ceil((new Date(date) - new Date(today)) / (1000*60*60*24));
  return diff <= 3 ? 'high' : diff <= 7 ? 'medium' : 'low';
}

function _remCard(r, isOverdue, isDone=false) {
  const today = new Date().toISOString().split('T')[0];
  const diff = r.reminder_date ? Math.ceil((new Date(r.reminder_date) - new Date(today)) / (1000*60*60*24)) : null;
  const pColors = { high:'var(--red)', medium:'var(--amber)', low:'var(--accent)' };
  const color = isOverdue ? 'var(--red)' : pColors[r.priority||'low'];

  return `<div style="display:flex;gap:10px;direction:rtl;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
    ${!r._isCourtDate ? `<input type="checkbox" ${isDone?'checked':''} onchange="_toggleRem('${r.id}',this.checked)"
      style="accent-color:var(--accent);width:16px;height:16px;flex-shrink:0;margin-top:3px;">` :
      `<span style="font-size:16px;flex-shrink:0;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M12 4v16"/><path d="M6 20h12"/><path d="M4 9l3-4 3 4"/><path d="M14 9l3-4 3 4"/><path d="M4 9a3 3 0 0 0 6 0"/><path d="M14 9a3 3 0 0 0 6 0"/></svg></span>`}
    <div style="flex:1;">
      <div style="font-size:13px;${isDone?'text-decoration:line-through;color:var(--text-muted);':''}direction:rtl;">${esc(r.text)}</div>
      <div style="font-size:10px;margin-top:3px;display:flex;gap:8px;align-items:center;direction:rtl;flex-wrap:wrap;">
        ${r.reminder_date ? `<span style="color:${color};">${formatDate(r.reminder_date)}${diff!==null&&!isDone?` (${diff<0?Math.abs(diff)+'دن پہلے':diff===0?'آج':diff+'دن باقی'})`:''}` : ''}
        ${r._isCourtDate ? `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;padding:1px 6px;border-radius:8px;font-size:9px;">عدالتی پیشی</span>` : ''}
        ${r.linked_fir ? `<span style="color:var(--accent);">FIR ${r.linked_fir}</span>` : ''}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px;">
      ${!r._isCourtDate ? `<button title="بند کریں" aria-label="بند کریں" class="btn btn-danger btn-sm" onclick="_deleteRem('${r.id}')" style="padding:3px 8px;font-size:11px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg></button>` :
        `<button title="منظور" aria-label="منظور" class="btn btn-secondary btn-sm" onclick="_remMarkCourtDone('${r._courtId}')" style="padding:3px 8px;font-size:11px;"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4.5 12.5l5 5 10-11"/></svg></button>`}
    </div>
  </div>`;
}

// ── ACTIONS ───────────────────────────────────────────────────
async function _toggleRem(id, done) {
  if (id.startsWith('court_')) return;
  await updateReminder(id, {is_done: done});
  await updateBadges();
  _buildReminders();
}

async function _deleteRem(id) {
  if (id.startsWith('court_')) return;
  try { await softDelete("reminder", id, {id, text: r?.text, reminder_date: r?.reminder_date}); } catch(_) {}
  await deleteReminder(id);
  showToast('یاددہانی ہٹا دی گئی', 'info');
  await updateBadges();
  _buildReminders();
}

// پہلے یہ نام court.js کے _markCourtDone سے ٹکراتا تھا (court بعد میں لوڈ ہو کر اسے دبا دیتا،
// جس سے یاددہانی سے مکمل کرنے پر غلطی سے عدالت کا صفحہ رینڈر ہوتا)۔ اب منفرد نام۔
async function _remMarkCourtDone(courtId) {
  await supabaseClient.from('court_dates').update({status:'done'}).eq('id', courtId);
  showToast('پیشی مکمل', 'success');
  _buildReminders();
}

function _openAddReminder() {
  openModal('+ نئی یاددہانی',
    `<div>
      <label class="form-label">یاددہانی کا متن *</label>
      <input class="form-input" id="rem-text" placeholder="مثلاً چالان جمع کرائیں FIR 245/26">
      <div class="form-row" style="margin-top:10px;">
        <div>
          <label class="form-label">تاریخ</label>
          <input class="form-input" id="rem-date" type="date">
        </div>
        <div>
          <label class="form-label">اہمیت</label>
          <select class="form-input" id="rem-priority">
            <option value="high">زیادہ</option>
            <option value="medium" selected>درمیانی</option>
            <option value="low">کم</option>
          </select>
        </div>
      </div>
      <div style="margin-top:10px;">
        <label class="form-label">FIR نمبر (اختیاری)</label>
        <input class="form-input" id="rem-fir" placeholder="مثلاً 245/26" dir="ltr" style="text-align:left;">
      </div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="_saveRem()">محفوظ</button>`
  );
}

async function _saveRem() {
  const text = document.getElementById('rem-text')?.value.trim();
  if (!text) { showToast('متن ضروری ہے', 'error'); return; }
  try {
    await addReminder({
      text,
      reminder_date: document.getElementById('rem-date')?.value || null,
      priority:      document.getElementById('rem-priority')?.value || 'medium',
      linked_fir:    document.getElementById('rem-fir')?.value.trim() || null,
    });
    closeModal();
    showToast('یاددہانی محفوظ', 'success');
    await updateBadges();
    _buildReminders();
  } catch(e) { showToast('' + e.message, 'error'); }
}

// ── DATA ──────────────────────────────────────────────────────
async function _remGetCourtDates() {
  const oid = await getOfficerId();
  const { data } = await supabaseClient.from('court_dates')
    .select('*').eq('officer_id', oid)
    .order('hearing_date', { ascending: true });
  return data || [];
}

// Legacy compatibility