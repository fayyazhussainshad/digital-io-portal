/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ADVANCED SEARCH  (v4 — whole system search)
   Searches: Cases · Patrol Logs · Reminders · 5-C · Evidence
   ═══════════════════════════════════════════════════════════ */

registerPage('search', renderSearch);

function renderSearch(container) {
  container.innerHTML = `
  <div style="max-width:960px;margin:0 auto;padding:8px 0;">
    <div style="margin-bottom:12px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">← واپس</button></div>

    <!-- SEARCH BAR -->
    <div style="position:relative;margin-bottom:14px;">
      <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;">🔍</span>
      <input id="sr-query" type="text" autocomplete="off"
        placeholder="🔍 سب کچھ تلاش کریں — FIR، نام، CNIC، واقعہ، پیشی، قانون..." dir="rtl"
        oninput="_srLive()"
        style="width:100%;box-sizing:border-box;padding:14px 14px 14px 46px;
               background:var(--bg-card);border:2px solid var(--border);
               border-radius:12px;color:var(--text-primary);font-size:15px;
               outline:none;transition:border-color 0.2s;"
        onfocus="this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor='var(--border)'">
      <span id="sr-clear" onclick="_srClear()"
        style="display:none;position:absolute;right:14px;top:50%;transform:translateY(-50%);
               cursor:pointer;font-size:18px;color:var(--text-muted);">✕</span>
    </div>

    <!-- FILTERS -->
    <div style="background:var(--bg-secondary);border-radius:10px;padding:12px 14px;margin-bottom:14px;">

      <!-- Section filter -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:64px;">SECTION</span>
        ${[['all','🔍 سب'],['cases','📁 مقدمات'],['patrol','🚔 گشت'],['reminders','🔔 یاددہانی'],['fivec','📋 5-C'],['evidence','📷 شہادت'],['incident','🚨 واقعہ'],['court','⚖️ پیشی'],['law','⚖️ قانون']].map(([k,l],i)=>
          `<button class="sr-pill ${i===0?'sr-pill-active':''}" id="sec-${k}" onclick="_srSection('${k}')">${l}</button>`
        ).join('')}
      </div>

      <!-- Cases: Party filter (only when cases/all) -->
      <div id="party-row" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:64px;">PARTY</span>
        ${['All','Complainant','Accused'].map((p,i)=>
          `<button class="sr-pill ${i===0?'sr-pill-active':''}" id="party-${p.toLowerCase()}"
            onclick="_srParty('${p.toLowerCase()}')">${p}</button>`
        ).join('')}
      </div>

      <!-- Cases: Status filter -->
      <div id="status-row" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:64px;">STATUS</span>
        <button class="sr-pill sr-pill-active" id="status-any" onclick="_srStatus('any')">Any</button>
        ${Object.entries(STATUS_LABELS).map(([k,v])=>
          `<button class="sr-pill" id="status-${k}" onclick="_srStatus('${k}')">${v}</button>`
        ).join('')}
      </div>

      <!-- Date filter -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:64px;">DATE</span>
        <input type="date" id="sr-from" onchange="_srLive()"
          style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;padding:5px 10px;color:var(--text-secondary);font-size:12px;">
        <span style="color:var(--text-muted);font-size:12px;">to</span>
        <input type="date" id="sr-to" onchange="_srLive()"
          style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;padding:5px 10px;color:var(--text-secondary);font-size:12px;">
        <button onclick="_srResetDates()"
          style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;padding:4px 6px;">Reset</button>
      </div>
    </div>

    <!-- RESULTS -->
    <div id="sr-results">
      <div style="text-align:center;padding:48px;color:var(--text-faint);">
        <div style="font-size:36px;margin-bottom:10px;">🔍</div>
        <div style="font-size:14px;font-weight:600;">Start typing to search</div>
        <div style="font-size:12px;margin-top:4px;">Searches Cases, Patrol Log, Reminders, 5-C Applications and Evidence</div>
      </div>
    </div>
  </div>

  <style>
    .sr-pill{padding:5px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-muted);font-size:12px;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
    .sr-pill:hover{border-color:var(--accent);color:var(--accent);}
    .sr-pill-active{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600;}
    .sr-section-header{font-size:11px;font-weight:700;color:var(--accent);letter-spacing:1px;text-transform:uppercase;padding:10px 0 6px;border-bottom:1px solid var(--border);margin-bottom:8px;}
  </style>`;

  window._srState = { section: 'all', party: 'all', status: 'any' };
}

// ── STATE HANDLERS ────────────────────────────────────────────
function _srSection(val) {
  window._srState.section = val;
  ['all','cases','patrol','reminders','fivec','evidence','incident','court','law'].forEach(s => {
    const el = document.getElementById('sec-' + s);
    if (el) el.className = 'sr-pill' + (s === val ? ' sr-pill-active' : '');
  });
  // Show/hide party & status rows for non-case sections
  const showCase = val === 'all' || val === 'cases';
  const pr = document.getElementById('party-row');
  const sr = document.getElementById('status-row');
  if (pr) pr.style.display = showCase ? 'flex' : 'none';
  if (sr) sr.style.display = showCase ? 'flex' : 'none';
  _srLive();
}

function _srParty(val) {
  window._srState.party = val;
  ['all','complainant','accused'].forEach(p => {
    const el = document.getElementById('party-' + p);
    if (el) el.className = 'sr-pill' + (p === val ? ' sr-pill-active' : '');
  });
  _srLive();
}

function _srStatus(val) {
  window._srState.status = val;
  document.querySelectorAll('[id^="status-"]').forEach(el => el.className = 'sr-pill');
  const a = document.getElementById('status-' + val);
  if (a) a.className = 'sr-pill sr-pill-active';
  _srLive();
}

function _srResetDates() {
  document.getElementById('sr-from').value = '';
  document.getElementById('sr-to').value   = '';
  _srLive();
}

function _srClear() {
  document.getElementById('sr-query').value = '';
  document.getElementById('sr-clear').style.display = 'none';
  _srSection('all');
  _srParty('all');
  _srStatus('any');
  _srResetDates();
  document.getElementById('sr-results').innerHTML = `
    <div style="text-align:center;padding:48px;color:var(--text-faint);">
      <div style="font-size:36px;margin-bottom:10px;">🔍</div>
      <div style="font-size:14px;font-weight:600;">Start typing to search</div>
    </div>`;
}

// ── LIVE SEARCH ───────────────────────────────────────────────
let _srTimer = null;
function _srLive() {
  const q = document.getElementById('sr-query')?.value || '';
  const clr = document.getElementById('sr-clear');
  if (clr) clr.style.display = q ? 'block' : 'none';
  clearTimeout(_srTimer);
  _srTimer = setTimeout(_srRun, 280);
}

async function _srRun() {
  const q       = (document.getElementById('sr-query')?.value || '').trim().toLowerCase();
  const section = window._srState?.section || 'all';
  const party   = window._srState?.party   || 'all';
  const status  = window._srState?.status  || 'any';
  const from    = document.getElementById('sr-from')?.value || '';
  const to      = document.getElementById('sr-to')?.value   || '';
  const res     = document.getElementById('sr-results');
  if (!res) return;

  if (!q && status === 'any' && !from && section === 'all') {
    res.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-faint);">
      <div style="font-size:36px;margin-bottom:10px;">🔍</div>
      <div style="font-size:14px;font-weight:600;">Start typing to search</div>
    </div>`;
    return;
  }

  res.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">🔍 Searching...</div>`;

  const words     = q ? q.split(/\s+/).filter(Boolean) : [];
  const wMatch    = str => !words.length || words.every(w => (str||'').toLowerCase().includes(w));
  const clean     = s   => (s||'').replace(/[-\s]/g,'').toLowerCase();
  const wMatchC   = str => !words.length || words.every(w => clean(str).includes(clean(w)));
  const parseDate = d   => {
    if (!d) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const p = d.split('-');
    return p.length===3&&p[2].length===4 ? `${p[2]}-${p[1]}-${p[0]}` : d;
  };

  let html = '';

  // ── CASES ──────────────────────────────────────────────────
  if (section === 'all' || section === 'cases') {
    const all = await getCases();
    const cases = all.filter(c => {
      if (status !== 'any' && c.status !== status) return false;
      if (from || to) {
        const cd = parseDate(c.fir_date);
        if (cd) { if (from && cd < from) return false; if (to && cd > to) return false; }
      }
      if (!words.length) return true;
      const mC = wMatch(c.fir_number)||wMatch(c.section_of_law)||wMatch(c.offence_type)||wMatch(c.complainant)||wMatchC(c.complainant_cnic)||wMatchC(c.complainant_cell);
      const mA = wMatch(c.fir_number)||wMatch(c.section_of_law)||wMatch(c.offence_type)||wMatch(c.accused_name)||wMatchC(c.accused_cnic)||wMatchC(c.accused_cell);
      if (party==='complainant') return mC;
      if (party==='accused') return mA;
      return mC||mA;
    });
    if (cases.length) {
      html += `<div class="sr-section-header">📁 Cases (${cases.length})</div>`;
      html += `<div style="overflow-x:auto;margin-bottom:16px;"><table class="data-table" style="width:100%;min-width:700px;"><thead><tr>
        <th>FIR No.</th><th>Complainant</th><th>Section</th><th>Status</th><th>Date</th><th></th>
      </tr></thead><tbody>
        ${cases.map(c=>`<tr>
          <td><span style="font-weight:800;color:var(--accent);cursor:pointer;" onclick="openCaseWorkspace('${c.id}')">${c.fir_number||'—'}</span></td>
          <td style="font-size:12px;">${c.complainant||'—'}</td>
          <td style="font-size:11px;">${[c.section_of_law,c.offence_type].filter(Boolean).join(' / ')||'—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status]||'pill-blue'}">${STATUS_LABELS[c.status]||c.status}</span></td>
          <td style="font-size:11px;">${formatDate(c.fir_date)}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')">📄</button></td>
        </tr>`).join('')}
      </tbody></table></div>`;
    }
  }

  // ── PATROL LOGS ────────────────────────────────────────────
  if (section === 'all' || section === 'patrol') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('patrol_logs')
        .select('*').eq('officer_id', oid)
        .order('logged_at', { ascending: false }).limit(500);
      const logs = (data||[]).filter(l =>
        wMatch(l.notes) || wMatch(l.address) ||
        wMatch(l.meta?.caller) || wMatch(l.meta?.cell) ||
        wMatch(l.meta?.response) || wMatch(l.meta?.entry_type)
      );
      if (logs.length) {
        html += `<div class="sr-section-header">🚔 Patrol Log (${logs.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${logs.map(l => {
            const m = l.meta||{};
            return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:18px;">${_ET?.[m.entry_type]?.icon||'📋'}</span>
              <div style="flex:1;">
                <div style="font-size:12px;font-weight:600;color:var(--accent);">${m.entry_type||l.log_type} · ${_timeStr?.(l.logged_at)||''}</div>
                ${m.caller?`<div style="font-size:11px;color:var(--text-muted);">👤 ${m.caller}${m.cell?' 📱'+m.cell:''}</div>`:''}
                <div style="font-size:12px;">${l.notes||''}</div>
                ${l.address?`<div style="font-size:11px;color:var(--text-muted);">📍 ${l.address}</div>`:''}
                ${l.lat?`<a href="https://maps.google.com/?q=${l.lat},${l.lng}" target="_blank" style="font-size:10px;color:var(--accent);">📌 Maps</a>`:''}
              </div>
              <span style="font-size:10px;color:var(--text-faint);white-space:nowrap;">${formatDate(l.logged_at)}</span>
            </div>`;
          }).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── REMINDERS ──────────────────────────────────────────────
  if (section === 'all' || section === 'reminders') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('reminders')
        .select('*').eq('officer_id', oid).order('reminder_date', { ascending: true });
      const rems = (data||[]).filter(r => wMatch(r.text)||wMatch(r.reminder_date));
      if (rems.length) {
        html += `<div class="sr-section-header">🔔 Reminders (${rems.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${rems.map(r=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">${r.is_done?'✅':'🔔'}</span>
            <div style="flex:1;"><div style="font-size:13px;">${r.text}</div>
            <div style="font-size:11px;color:var(--accent);">⏰ ${formatDate(r.reminder_date)}</div></div>
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── 5-C APPLICATIONS ───────────────────────────────────────
  if (section === 'all' || section === 'fivec') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('applications_5c')
        .select('*').eq('officer_id', oid).order('created_at', { ascending: false });
      const apps = (data||[]).filter(a =>
        wMatch(a.complainant_name) || wMatch(a.subject) ||
        wMatch(a.fir_number) || wMatch(a.response_text)
      );
      if (apps.length) {
        html += `<div class="sr-section-header">📋 5-C Applications (${apps.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${apps.map(a=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;">
            <div style="font-size:13px;font-weight:600;">${a.subject||'5-C Application'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${a.complainant_name||'—'} · S/N ${a.serial_number||'—'} · ${formatDate(a.created_at)}</div>
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── EVIDENCE / شہادتیں ─────────────────────────────────────
  if (section === 'all' || section === 'evidence') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('evidence')
        .select('*').eq('officer_id', oid).order('created_at', { ascending: false });
      const evs = (data||[]).filter(e =>
        wMatch(e.name) || wMatch(e.notes) ||
        wMatch(e.type) || wMatch(e.fir_number)
      );
      if (evs.length) {
        html += `<div class="sr-section-header">📷 شہادتیں (${evs.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${evs.map(e=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;gap:10px;align-items:center;">
            <span style="font-size:22px;">${e.type==='Photo'?'📷':e.type==='Video'?'🎥':'📎'}</span>
            <div style="flex:1;"><div style="font-size:13px;font-weight:600;">${e.name||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">FIR ${e.fir_number||'—'} · ${formatDate(e.created_at)}</div>
            ${e.notes?`<div style="font-size:11px;color:var(--text-faint);">${e.notes}</div>`:''}
            </div>
            ${e.file_url?`<a href="${e.file_url}" target="_blank" class="btn btn-secondary btn-sm">📂 Open</a>`:''}
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── INCIDENT REPORTS ───────────────────────────────────────
  if (section === 'all' || section === 'incident') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('incident_reports')
        .select('*').eq('officer_id', oid).order('created_at', { ascending: false });
      const incs = (data||[]).filter(i =>
        wMatch(i.report_number)||wMatch(i.address)||
        wMatch(i.narrative)||wMatch(i.incident_type)
      );
      if (incs.length) {
        html += `<div class="sr-section-header">🚨 واقعاتی رپورٹس (${incs.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${incs.map(i=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;direction:rtl;">
            <div style="font-size:13px;font-weight:600;">رپورٹ ${i.report_number||'—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${i.incident_date||'—'} · ${i.address||'—'}</div>
            ${i.narrative?`<div style="font-size:11px;color:var(--text-faint);">${i.narrative.slice(0,80)}...</div>`:''}
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── COURT DATES ─────────────────────────────────────────────
  if (section === 'all' || section === 'court') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('court_dates')
        .select('*').eq('officer_id', oid).order('hearing_date', { ascending: true });
      const courts = (data||[]).filter(d =>
        wMatch(d.fir_number)||wMatch(d.court_name)||
        wMatch(d.judge_name)||wMatch(d.purpose)
      );
      if (courts.length) {
        html += `<div class="sr-section-header">⚖️ عدالتی پیشیاں (${courts.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${courts.map(d=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;direction:rtl;">
            <div style="font-size:13px;font-weight:600;">FIR ${d.fir_number||'—'} · ${d.court_name||'—'}</div>
            <div style="font-size:11px;color:var(--accent);">📅 ${formatDate(d.hearing_date)} · ${d.hearing_time||'—'}</div>
            ${d.purpose?`<div style="font-size:11px;color:var(--text-muted);">${d.purpose}</div>`:''}
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  // ── LAW LIBRARY ──────────────────────────────────────────────
  if (section === 'all' || section === 'law') {
    try {
      const oid = await getOfficerId();
      const { data } = await supabaseClient.from('law_library')
        .select('*').eq('officer_id', oid).neq('category','template');
      const laws = (data||[]).filter(l => wMatch(l.title)||wMatch(l.content));
      if (laws.length) {
        html += `<div class="sr-section-header">⚖️ قانونی لائبریری (${laws.length})</div>`;
        html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${laws.map(l=>`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 12px;direction:rtl;">
            <div style="font-size:13px;font-weight:600;">${l.title}</div>
            <div style="font-size:11px;color:var(--text-muted);">${l.category||'—'}</div>
          </div>`).join('')}
        </div>`;
      }
    } catch(_) {}
  }

  if (!html) {
    html = `<div style="text-align:center;padding:48px;color:var(--text-muted);direction:rtl;">
      <div style="font-size:32px;margin-bottom:10px;">🔍</div>
      <div style="font-weight:600;font-family:'Jameel Noori Nastaleeq',serif;">کوئی نتیجہ نہیں ملا</div>
      <div style="font-size:12px;margin-top:4px;">دوسرے الفاظ آزمائیں</div>
    </div>`;
  }

  res.innerHTML = html;
}
