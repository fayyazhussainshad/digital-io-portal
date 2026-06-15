/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — REMINDERS  (reminders.js)
   Urdu UI · Auto reminders · Court dates merged · Manual add
   ═══════════════════════════════════════════════════════════ */

registerPage('reminders', renderReminders);

async function renderReminders(container) {
  container.innerHTML = `<div style="max-width:800px;margin:0 auto;" id="rem-root">
    <div style="text-align:center;padding:20px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>
  </div>`;
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
      text: `⚖️ عدالتی پیشی — FIR ${d.fir_number||'—'} · ${d.court_name||'—'}${d.hearing_time?' · '+d.hearing_time:''}${d.purpose?' · '+d.purpose:''}`,
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
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;direction:rtl;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;display:inline-flex;align-items:center;gap:6px;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">↩</button>
    <div>
      <div style="font-size:18px;font-weight:800;">🔔 یاددہانیاں</div>
      <div style="font-size:12px;color:var(--text-muted);">خودکار · عدالتی پیشیاں · دستی</div>
    </div>
    <button class="btn btn-primary" onclick="_openAddReminder()">+ نئی یاددہانی</button>
  </div>

  <!-- Overdue Alert -->
  ${overdue.length ? `
  <div style="background:rgba(239,68,68,0.1);border:1px solid var(--red);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px;">⚠️ گزری ہوئی یاددہانیاں (${overdue.length})</div>
    ${overdue.map(r => _remCard(r, true)).join('')}
  </div>` : ''}

  <!-- Upcoming -->
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">🔔 آنے والی یاددہانیاں (${upcoming.length})</div>
    ${upcoming.length ? upcoming.map(r => _remCard(r, false)).join('')
    : `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">✅ کوئی یاددہانی نہیں</div>`}
  </div>

  <!-- Done -->
  ${done.length ? `
  <details>
    <summary style="cursor:pointer;font-size:12px;color:var(--text-muted);padding:8px 0;">✅ مکمل یاددہانیاں (${done.length})</summary>
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
      `<span style="font-size:16px;flex-shrink:0;">⚖️</span>`}
    <div style="flex:1;">
      <div style="font-size:13px;${isDone?'text-decoration:line-through;color:var(--text-muted);':''}direction:rtl;">${r.text}</div>
      <div style="font-size:10px;margin-top:3px;display:flex;gap:8px;align-items:center;direction:rtl;flex-wrap:wrap;">
        ${r.reminder_date ? `<span style="color:${color};">📅 ${formatDate(r.reminder_date)}${diff!==null&&!isDone?` (${diff<0?Math.abs(diff)+'دن پہلے':diff===0?'آج':diff+'دن باقی'})`:''}` : ''}
        ${r._isCourtDate ? `<span style="background:rgba(167,139,250,0.2);color:#a78bfa;padding:1px 6px;border-radius:8px;font-size:9px;">عدالتی پیشی</span>` : ''}
        ${r.linked_fir ? `<span style="color:var(--accent);">FIR ${r.linked_fir}</span>` : ''}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px;">
      ${!r._isCourtDate ? `<button class="btn btn-danger btn-sm" onclick="_deleteRem('${r.id}')" style="padding:3px 8px;font-size:11px;">✕</button>` :
        `<button class="btn btn-secondary btn-sm" onclick="_markCourtDone('${r._courtId}')" style="padding:3px 8px;font-size:11px;">✅</button>`}
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
  showToast('🗑️ یاددہانی ہٹا دی گئی', 'info');
  await updateBadges();
  _buildReminders();
}

async function _markCourtDone(courtId) {
  await supabaseClient.from('court_dates').update({status:'done'}).eq('id', courtId);
  showToast('✅ پیشی مکمل', 'success');
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
            <option value="high">🔴 زیادہ</option>
            <option value="medium" selected>🟡 درمیانی</option>
            <option value="low">🔵 کم</option>
          </select>
        </div>
      </div>
      <div style="margin-top:10px;">
        <label class="form-label">FIR نمبر (اختیاری)</label>
        <input class="form-input" id="rem-fir" placeholder="مثلاً 245/26" dir="ltr" style="text-align:left;">
      </div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="_saveRem()">💾 محفوظ</button>`
  );
}

async function _saveRem() {
  const text = document.getElementById('rem-text')?.value.trim();
  if (!text) { showToast('⚠️ متن ضروری ہے', 'error'); return; }
  try {
    await addReminder({
      text,
      reminder_date: document.getElementById('rem-date')?.value || null,
      priority:      document.getElementById('rem-priority')?.value || 'medium',
      linked_fir:    document.getElementById('rem-fir')?.value.trim() || null,
    });
    closeModal();
    showToast('✅ یاددہانی محفوظ', 'success');
    await updateBadges();
    _buildReminders();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
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
function openAddReminderModal() { _openAddReminder(); }
async function saveReminder() { await _saveRem(); }
async function toggleReminder(id, done) { await _toggleRem(id, done); }
async function doDeleteReminder(id) { await _deleteRem(id); }

// ── SMS via Native App ─────────────────────────────────────────
function _smsSend(text, date) { // WhatsApp instead of SMS
  const o = currentOfficer || {};
  const phone = o.official_phone || o.phone || '';
  const msg = `Digital IO یاددہانی:\n${text}${date?'\nتاریخ: '+date:''}\n\nتھانہ ${o.station||'—'}`;
  if (phone) {
    var waMsg = encodeURIComponent(msg);
    window.open('https://wa.me/92' + phone.replace(/^0/,'').replace(/-/g,'') + '?text=' + waMsg);
  } else {
    openModal('📱 WhatsApp بھیجیں',
      `<div style="direction:rtl;">
        <label class="form-label">نمبر درج کریں</label>
        <input class="form-input" id="sms-num" placeholder="0300-0000000" dir="ltr">
        <div style="margin-top:10px;padding:10px;background:var(--bg-secondary);border-radius:6px;font-size:12px;">${msg}</div>
      </div>`,
      `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
       <button class="btn btn-primary" onclick="var num = document.getElementById('sms-num').value.replace(/^0/,'').replace(/-/g,''); window.open('https://wa.me/92' + num + '?text=' + encodeURIComponent(msg));closeModal();">📱 WhatsApp کھولیں</button>`
    );
  }
}
