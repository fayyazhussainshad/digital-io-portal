/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — PATROL LOG  (patrol.js)
   GPS tracking · Checkpoints · Incidents · Shift history
   ═══════════════════════════════════════════════════════════ */

registerPage('patrol', renderPatrol);

let _activeShift    = null;
let _gpsInterval    = null;
let _shiftTimer     = null;
let _shiftSeconds   = 0;

// ── MAIN RENDER ───────────────────────────────────────────────
async function renderPatrol(container) {
  container.innerHTML = `<div style="padding:8px 0;" id="patrol-root">
    <div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">Loading...</div>
  </div>`;
  await _loadActiveShift();
  _renderPatrolRoot();
}

async function _loadActiveShift() {
  try {
    const oid = await getOfficerId();
    if (!oid) return;
    const { data } = await supabaseClient
      .from('patrol_shifts')
      .select('*')
      .eq('officer_id', oid)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1);
    _activeShift = (data && data.length) ? data[0] : null;
  } catch(e) { _activeShift = null; }
}

function _renderPatrolRoot() {
  const root = document.getElementById('patrol-root');
  if (!root) return;
  if (_activeShift) {
    _renderActiveShift(root);
    _startShiftTimer();
    _startGPSTracking();
  } else {
    _renderPatrolHome(root);
  }
}

// ── HOME (no active shift) ────────────────────────────────────
async function _renderPatrolHome(root) {
  const history = await _fetchShiftHistory();
  root.innerHTML = `
    <!-- Start card -->
    <div class="card" style="text-align:center;padding:32px 20px;margin-bottom:16px;">
      <div style="font-size:56px;margin-bottom:12px;">🚔</div>
      <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:6px;">Patrol Log</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Track your patrol shifts, checkpoints and incidents</div>
      <button class="btn btn-primary" style="font-size:15px;padding:12px 32px;" onclick="startPatrolShift()">
        🟢 Start Patrol Shift
      </button>
    </div>

    <!-- History -->
    ${history.length ? `
    <div class="card">
      <div class="card-title" style="margin-bottom:12px;">📋 Shift History</div>
      ${history.map(s => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:24px;">📅</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;">${formatDate(s.started_at)}</div>
            <div style="font-size:11px;color:var(--text-muted);">
              ${_timeStr(s.started_at)} → ${s.ended_at ? _timeStr(s.ended_at) : 'Ongoing'}
              &nbsp;·&nbsp; ${s.ended_at ? _duration(s.started_at, s.ended_at) : '—'}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="viewShiftDetail('${s.id}')">View</button>
        </div>`).join('')}
    </div>` : ''}`;
}

// ── ACTIVE SHIFT ──────────────────────────────────────────────
function _renderActiveShift(root) {
  root.innerHTML = `
    <!-- Status bar -->
    <div style="background:rgba(34,197,94,0.1);border:1px solid var(--green);border-radius:10px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
      <div style="width:12px;height:12px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(34,197,94,0.2);animation:pulse 2s infinite;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:var(--green);">Shift Active</div>
        <div style="font-size:12px;color:var(--text-muted);">Started: ${_timeStr(_activeShift.started_at)}</div>
      </div>
      <div style="font-size:28px;font-weight:900;color:var(--green);font-family:var(--font-mono);" id="shift-timer">00:00:00</div>
    </div>

    <!-- GPS status -->
    <div class="card" style="margin-bottom:12px;padding:12px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text-primary);">📍 GPS Tracking</div>
          <div style="font-size:11px;color:var(--text-muted);" id="gps-status">Acquiring location...</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="_captureGPS(true)">📍 Log Now</button>
      </div>
    </div>

    <!-- Action buttons -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
      <button class="btn btn-primary" style="padding:14px 8px;font-size:13px;flex-direction:column;" onclick="logQuickCall()">
        📞<br><span style="font-size:11px;margin-top:4px;">Quick Call</span>
      </button>
      <button class="btn btn-secondary" style="padding:14px 8px;font-size:13px;flex-direction:column;" onclick="logCheckpoint()">
        📍<br><span style="font-size:11px;margin-top:4px;">Checkpoint</span>
      </button>
      <button class="btn btn-secondary" style="padding:14px 8px;font-size:13px;flex-direction:column;" onclick="logIncident()">
        ⚠️<br><span style="font-size:11px;margin-top:4px;">Incident</span>
      </button>
    </div>

    <!-- Live log -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title" style="margin-bottom:10px;">📋 This Shift's Log</div>
      <div id="patrol-live-log" style="max-height:300px;overflow-y:auto;">
        <div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">Loading logs...</div>
      </div>
    </div>

    <!-- End shift -->
    <div style="text-align:center;">
      <button class="btn btn-danger" style="padding:12px 32px;" onclick="confirmEndShift()">
        ⏹ End Shift
      </button>
    </div>`;

  _loadLiveLog();
}

// ── SHIFT TIMER ───────────────────────────────────────────────
function _startShiftTimer() {
  if (_shiftTimer) clearInterval(_shiftTimer);
  const start = new Date(_activeShift.started_at).getTime();
  _shiftTimer = setInterval(() => {
    const el = document.getElementById('shift-timer');
    if (!el) { clearInterval(_shiftTimer); return; }
    const diff = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    el.textContent = h + ':' + m + ':' + s;
  }, 1000);
}

// ── GPS TRACKING ──────────────────────────────────────────────
function _startGPSTracking() {
  if (_gpsInterval) clearInterval(_gpsInterval);
  _captureGPS(false);                           // immediate first capture
  _gpsInterval = setInterval(() => _captureGPS(false), 120000); // every 2 min
}

async function _captureGPS(manual) {
  if (!_activeShift) return;
  if (!navigator.geolocation) {
    _setGPSStatus('GPS not available on this device');
    return;
  }
  _setGPSStatus('📡 Acquiring location...');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);
      let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      // Reverse geocode (online only)
      if (navigator.onLine) {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const j = await r.json();
          address = j.display_name ? j.display_name.split(',').slice(0,3).join(',') : address;
        } catch(_) {}
      }

      _setGPSStatus(`📍 ${address} (±${acc}m) — ${_timeStr(new Date().toISOString())}`);

      // Save to DB
      const oid = await getOfficerId();
      await supabaseClient.from('patrol_logs').insert({
        shift_id:  _activeShift.id,
        officer_id: oid,
        log_type:  manual ? 'checkpoint' : 'gps',
        lat, lng, address,
        notes:     manual ? 'Manual GPS capture' : 'Auto GPS',
        logged_at: new Date().toISOString(),
      });

      if (manual) {
        showToast('📍 Location logged!', 'success');
        _loadLiveLog();
      }
    },
    (err) => {
      const msgs = { 1:'GPS permission denied', 2:'Position unavailable', 3:'GPS timeout' };
      _setGPSStatus('⚠️ ' + (msgs[err.code] || err.message));
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
}

function _setGPSStatus(msg) {
  const el = document.getElementById('gps-status');
  if (el) el.textContent = msg;
}

// ── QUICK CALL LOG ────────────────────────────────────────────
function logQuickCall() {
  openModal('📞 Quick Call Log',
    `<div style="margin-bottom:10px;">
       <label class="form-label">Caller Name</label>
       <input class="form-input" id="call-name" placeholder="e.g. Muhammad Ali" autocomplete="off">
     </div>
     <div style="margin-bottom:10px;">
       <label class="form-label">Cell Number</label>
       <input class="form-input" id="call-number" type="tel" placeholder="0300-1234567">
     </div>
     <div style="margin-bottom:10px;">
       <label class="form-label">Problem / Masla *</label>
       <textarea class="form-input" id="call-notes" rows="3" placeholder="Caller ne kya bataya..."></textarea>
     </div>
     <div>
       <label class="form-label">Follow-up Reminder?</label>
       <select class="form-input" id="call-reminder">
         <option value="">No reminder</option>
         <option value="1">1 hour baad</option>
         <option value="3">3 hours baad</option>
         <option value="24">Kal (24 hours)</option>
       </select>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveQuickCall()">📞 Save Call</button>`
  );
}

async function saveQuickCall() {
  const name     = document.getElementById('call-name')?.value.trim()   || 'Unknown';
  const number   = document.getElementById('call-number')?.value.trim() || '';
  const notes    = document.getElementById('call-notes')?.value.trim()  || '';
  const reminder = document.getElementById('call-reminder')?.value      || '';
  if (!notes) { showToast('⚠️ Masla likhna zaruri hai', 'error'); return; }
  closeModal();

  const oid = await getOfficerId();
  const noteText = `[CALL] ${name}${number?' ('+number+')':''}: ${notes}`;

  // Save as patrol log entry
  const saveEntry = async (lat, lng, address) => {
    await supabaseClient.from('patrol_logs').insert({
      shift_id:   _activeShift?.id || null,
      officer_id: oid,
      log_type:   'checkpoint',
      lat, lng, address,
      notes:      noteText,
      severity:   'medium',
      logged_at:  new Date().toISOString(),
    });

    // Set reminder if requested
    if (reminder) {
      const remindAt = new Date(Date.now() + parseInt(reminder) * 3600000).toISOString();
      await supabaseClient.from('reminders').insert({
        officer_id:    oid,
        text:          `Follow-up: ${name}${number?' '+number:''} — ${notes.slice(0,80)}`,
        reminder_date: remindAt,
        is_done:       false,
      });
      showToast('✅ Call logged + reminder set!', 'success');
    } else {
      showToast('✅ Call logged!', 'success');
    }
    if (_activeShift) _loadLiveLog();
  };

  // Try to get GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let address = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        if (navigator.onLine) {
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const j = await r.json();
            address = j.display_name ? j.display_name.split(',').slice(0,3).join(',') : address;
          } catch(_) {}
        }
        await saveEntry(pos.coords.latitude, pos.coords.longitude, address);
      },
      async () => await saveEntry(null, null, null),
      { timeout: 6000 }
    );
  } else {
    await saveEntry(null, null, null);
  }
}

// ── LOG CHECKPOINT ────────────────────────────────────────────
function logCheckpoint() {
  openModal('📍 Log Checkpoint',
    `<div style="margin-bottom:10px;">
       <label class="form-label">Notes (optional)</label>
       <textarea class="form-input" id="cp-notes" rows="3" placeholder="e.g. Area clear, suspicious vehicle noted..."></textarea>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveCheckpoint()">📍 Log Checkpoint</button>`
  );
}

async function saveCheckpoint() {
  const notes = document.getElementById('cp-notes')?.value.trim() || '';
  closeModal();
  if (!navigator.geolocation) { showToast('⚠️ GPS not available', 'error'); return; }
  showToast('📡 Getting location...', 'info', 2000);
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (navigator.onLine) {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const j = await r.json();
        address = j.display_name ? j.display_name.split(',').slice(0,3).join(',') : address;
      } catch(_) {}
    }
    const oid = await getOfficerId();
    await supabaseClient.from('patrol_logs').insert({
      shift_id: _activeShift.id, officer_id: oid,
      log_type: 'checkpoint', lat, lng, address, notes,
      logged_at: new Date().toISOString(),
    });
    showToast('✅ Checkpoint logged!', 'success');
    _loadLiveLog();
  }, () => showToast('⚠️ Could not get GPS', 'error'), { enableHighAccuracy: true, timeout: 10000 });
}

// ── LOG INCIDENT ──────────────────────────────────────────────
function logIncident() {
  openModal('⚠️ Log Incident',
    `<div style="margin-bottom:10px;">
       <label class="form-label">Incident Type</label>
       <select class="form-input" id="inc-type">
         <option>Suspicious Activity</option>
         <option>Traffic Violation</option>
         <option>Disturbance</option>
         <option>Arrest Made</option>
         <option>Accident</option>
         <option>Other</option>
       </select>
     </div>
     <div style="margin-bottom:10px;">
       <label class="form-label">Severity</label>
       <select class="form-input" id="inc-sev">
         <option value="low">Low</option>
         <option value="medium" selected>Medium</option>
         <option value="high">High</option>
       </select>
     </div>
     <div>
       <label class="form-label">Notes *</label>
       <textarea class="form-input" id="inc-notes" rows="3" placeholder="Describe the incident..."></textarea>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveIncident()">⚠️ Log Incident</button>`
  );
}

async function saveIncident() {
  const type  = document.getElementById('inc-type')?.value || '';
  const sev   = document.getElementById('inc-sev')?.value  || 'medium';
  const notes = document.getElementById('inc-notes')?.value.trim() || '';
  if (!notes) { showToast('⚠️ Please describe the incident', 'error'); return; }
  closeModal();
  showToast('📡 Getting location...', 'info', 2000);
  const oid = await getOfficerId();
  const saveLog = async (lat, lng, address) => {
    await supabaseClient.from('patrol_logs').insert({
      shift_id: _activeShift.id, officer_id: oid,
      log_type: 'incident', lat, lng, address,
      notes: `[${type}] ${notes}`, severity: sev,
      logged_at: new Date().toISOString(),
    });
    showToast('✅ Incident logged!', 'success');
    _loadLiveLog();
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let address = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        if (navigator.onLine) {
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const j = await r.json();
            address = j.display_name ? j.display_name.split(',').slice(0,3).join(',') : address;
          } catch(_) {}
        }
        await saveLog(pos.coords.latitude, pos.coords.longitude, address);
      },
      async () => await saveLog(null, null, 'Location unavailable'),
      { timeout: 8000 }
    );
  } else {
    await saveLog(null, null, 'GPS not available');
  }
}

// ── LIVE LOG ──────────────────────────────────────────────────
async function _loadLiveLog() {
  const el = document.getElementById('patrol-live-log');
  if (!el || !_activeShift) return;
  try {
    const { data } = await supabaseClient
      .from('patrol_logs')
      .select('*')
      .eq('shift_id', _activeShift.id)
      .order('logged_at', { ascending: false })
      .limit(50);
    const logs = data || [];
    if (!logs.length) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">No logs yet — GPS tracking is active</div>';
      return;
    }
    const icons = { gps:'📡', checkpoint:'📍', incident:'⚠️' };
    const sevColors = { high:'var(--red)', medium:'var(--amber)', low:'var(--green)' };
    el.innerHTML = logs.map(l => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
        <span style="font-size:16px;flex-shrink:0;">${icons[l.log_type]||'📋'}</span>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:600;color:${l.log_type==='incident'?(sevColors[l.severity]||'var(--amber)'):'var(--text-primary)'};">
              ${l.log_type==='gps'?'GPS Auto':l.log_type==='checkpoint'?'Checkpoint':'Incident'}
            </span>
            <span style="font-size:10px;color:var(--text-faint);">${_timeStr(l.logged_at)}</span>
          </div>
          ${l.address ? `<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.address}</div>` : ''}
          ${l.notes && l.log_type!=='gps' ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${l.notes}</div>` : ''}
          ${l.lat ? `<a href="https://maps.google.com/?q=${l.lat},${l.lng}" target="_blank" style="font-size:10px;color:var(--accent);">📌 Open in Maps</a>` : ''}
        </div>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px;">Could not load logs</div>';
  }
}

// ── START SHIFT ───────────────────────────────────────────────
async function startPatrolShift() {
  try {
    const oid = await getOfficerId();
    if (!oid) { showToast('⚠️ Not logged in', 'error'); return; }
    const { data, error } = await supabaseClient.from('patrol_shifts')
      .insert({ officer_id: oid, status: 'active', started_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    _activeShift = data;
    showToast('🟢 Patrol shift started!', 'success');
    const root = document.getElementById('patrol-root');
    if (root) { _renderActiveShift(root); _startShiftTimer(); _startGPSTracking(); }
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── END SHIFT ─────────────────────────────────────────────────
function confirmEndShift() {
  openModal('⏹ End Patrol Shift',
    `<p style="color:var(--text-secondary);font-size:13px;">Are you sure you want to end this patrol shift?<br><br>
     <label class="form-label">Final Notes (optional)</label>
     <textarea class="form-input" id="end-notes" rows="2" placeholder="Any notes for this shift..."></textarea></p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="endPatrolShift()">⏹ End Shift</button>`
  );
}

async function endPatrolShift() {
  const notes = document.getElementById('end-notes')?.value.trim() || '';
  closeModal();
  try {
    await supabaseClient.from('patrol_shifts').update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      notes,
    }).eq('id', _activeShift.id);
    // Stop timers
    clearInterval(_gpsInterval); _gpsInterval = null;
    clearInterval(_shiftTimer);  _shiftTimer  = null;
    _activeShift = null;
    showToast('✅ Shift ended. Good work, Officer!', 'success');
    const container = document.getElementById('page-content');
    if (container) renderPatrol(container);
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── SHIFT DETAIL ──────────────────────────────────────────────
async function viewShiftDetail(shiftId) {
  openModal('📋 Shift Detail', '<div style="text-align:center;padding:20px;">Loading...</div>', '');
  try {
    const { data: logs } = await supabaseClient
      .from('patrol_logs').select('*')
      .eq('shift_id', shiftId).order('logged_at', { ascending: true });
    const { data: shift } = await supabaseClient
      .from('patrol_shifts').select('*').eq('id', shiftId).single();
    const icons = { gps:'📡', checkpoint:'📍', incident:'⚠️' };
    const body = `
      <div style="margin-bottom:12px;padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:12px;">
        <div>📅 ${formatDate(shift.started_at)} &nbsp;|&nbsp; ${_timeStr(shift.started_at)} → ${shift.ended_at?_timeStr(shift.ended_at):'—'}</div>
        <div style="color:var(--text-muted);margin-top:4px;">Duration: ${shift.ended_at?_duration(shift.started_at,shift.ended_at):'—'} &nbsp;|&nbsp; ${logs.length} log entries</div>
        ${shift.notes?`<div style="margin-top:4px;color:var(--text-secondary);">${shift.notes}</div>`:''}
      </div>
      <div style="max-height:400px;overflow-y:auto;">
        ${(logs||[]).map(l=>`
          <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
            <span>${icons[l.log_type]||'📋'}</span>
            <div>
              <span style="font-weight:600;">${l.log_type==='gps'?'GPS':l.log_type==='checkpoint'?'Checkpoint':'Incident'}</span>
              <span style="color:var(--text-faint);margin-left:6px;">${_timeStr(l.logged_at)}</span>
              ${l.address?`<div style="color:var(--text-muted);">${l.address}</div>`:''}
              ${l.notes&&l.log_type!=='gps'?`<div style="color:var(--text-secondary);">${l.notes}</div>`:''}
              ${l.lat?`<a href="https://maps.google.com/?q=${l.lat},${l.lng}" target="_blank" style="color:var(--accent);font-size:10px;">📌 Maps</a>`:''}
            </div>
          </div>`).join('')}
      </div>`;
    document.querySelector('#modal-root .modal-body').innerHTML = body;
    document.querySelector('#modal-root .modal-footer').innerHTML =
      '<button class="btn btn-secondary" onclick="closeModal()">Close</button>';
  } catch(e) { showToast('❌ '+e.message,'error'); closeModal(); }
}

// ── HISTORY ───────────────────────────────────────────────────
async function _fetchShiftHistory() {
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient.from('patrol_shifts')
      .select('*').eq('officer_id', oid)
      .in('status', ['completed'])
      .order('started_at', { ascending: false }).limit(20);
    return data || [];
  } catch(_) { return []; }
}

// ── HELPERS ───────────────────────────────────────────────────
function _timeStr(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  return h + ':' + m;
}

function _duration(start, end) {
  const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return (h ? h + 'h ' : '') + m + 'm';
}
