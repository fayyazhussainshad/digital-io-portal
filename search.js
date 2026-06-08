/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ADVANCED SEARCH  (v3 — unified smart search)
   One bar searches everything. Filter pills below.
   ═══════════════════════════════════════════════════════════ */

registerPage('search', renderSearch);

function renderSearch(container) {
  container.innerHTML = `
  <div style="max-width:900px;margin:0 auto;padding:8px 0;">

    <!-- ── SINGLE SEARCH BAR ── -->
    <div style="position:relative;margin-bottom:16px;">
      <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;">🔍</span>
      <input id="sr-query"
        type="text"
        autocomplete="off"
        placeholder="Search by FIR No, Name, CNIC, Cell No, Section of Law, Offence..."
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

    <!-- ── FILTERS ── -->
    <div style="display:flex;flex-direction:column;gap:10px;padding:12px 14px;
                background:var(--bg-secondary);border-radius:10px;margin-bottom:16px;">

      <!-- Party filter -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:52px;">PARTY</span>
        ${['All','Complainant','Accused'].map((p,i)=>
          `<button class="sr-pill ${i===0?'sr-pill-active':''}" id="party-${p.toLowerCase()}"
            onclick="_srParty('${p.toLowerCase()}')">${p}</button>`
        ).join('')}
      </div>

      <!-- Status filter -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:52px;">STATUS</span>
        <button class="sr-pill sr-pill-active" id="status-any" onclick="_srStatus('any')">Any</button>
        ${Object.entries(STATUS_LABELS).map(([k,v])=>
          `<button class="sr-pill" id="status-${k}" onclick="_srStatus('${k}')">${v}</button>`
        ).join('')}
      </div>

      <!-- Date filter -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;min-width:52px;">DATE</span>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <input type="date" id="sr-from" onchange="_srLive()"
            style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;
                   padding:5px 10px;color:var(--text-secondary);font-size:12px;">
          <span style="color:var(--text-muted);font-size:12px;">to</span>
          <input type="date" id="sr-to" onchange="_srLive()"
            style="background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;
                   padding:5px 10px;color:var(--text-secondary);font-size:12px;">
          <button onclick="_srResetDates()"
            style="background:none;border:none;color:var(--text-muted);font-size:11px;cursor:pointer;padding:4px 6px;">
            Reset
          </button>
        </div>
      </div>

    </div>

    <!-- ── RESULTS ── -->
    <div id="sr-results">
      <div style="text-align:center;padding:48px;color:var(--text-faint);">
        <div style="font-size:36px;margin-bottom:10px;">🔍</div>
        <div style="font-size:14px;font-weight:600;">Start typing to search</div>
        <div style="font-size:12px;margin-top:4px;">Searches FIR No, names, CNIC, cell, section and offence simultaneously</div>
      </div>
    </div>

  </div>

  <style>
    .sr-pill{
      padding:5px 14px;border-radius:20px;border:1px solid var(--border);
      background:var(--bg-tertiary);color:var(--text-muted);
      font-size:12px;cursor:pointer;transition:all 0.15s;white-space:nowrap;
    }
    .sr-pill:hover{ border-color:var(--accent);color:var(--accent); }
    .sr-pill-active{
      background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600;
    }
  </style>`;

  // No default dates — date filter only applies when user explicitly sets it
  window._srState = { party: 'all', status: 'any' };
}

// ── STATE ─────────────────────────────────────────────────────
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
  const active = document.getElementById('status-' + val);
  if (active) active.className = 'sr-pill sr-pill-active';
  _srLive();
}

function _srResetDates() {
  document.getElementById('sr-from').value = '';
  document.getElementById('sr-to').value   = new Date().toISOString().split('T')[0];
  _srLive();
}

function _srClear() {
  document.getElementById('sr-query').value = '';
  document.getElementById('sr-clear').style.display = 'none';
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
  _srTimer = setTimeout(_srRun, 250);
}

async function _srRun() {
  const q      = (document.getElementById('sr-query')?.value || '').trim().toLowerCase();
  const party  = window._srState?.party  || 'all';
  const status = window._srState?.status || 'any';
  const from   = document.getElementById('sr-from')?.value || '';
  const to     = document.getElementById('sr-to')?.value   || '';

  const res = document.getElementById('sr-results');
  if (!res) return;

  // Need at least a query or a non-default filter
  if (!q && status === 'any' && !from) {
    res.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text-faint);">
        <div style="font-size:36px;margin-bottom:10px;">🔍</div>
        <div style="font-size:14px;font-weight:600;">Start typing to search</div>
      </div>`;
    return;
  }

  res.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">🔍 Searching...</div>`;

  const all = await getCases();
  const clean = s => (s || '').replace(/[-\s]/g, '').toLowerCase();

  // Split query into words — ALL words must appear somewhere (AND within query, OR across fields)
  const words = q ? q.trim().toLowerCase().split(/\s+/).filter(Boolean) : [];
  const wordMatch = (str) => !words.length || words.every(w => (str||'').toLowerCase().includes(w));
  const wordMatchClean = (str) => !words.length || words.every(w => clean(str).includes(clean(w)));

  const results = all.filter(c => {
    // ── Status filter ──
    if (status !== 'any' && c.status !== status) return false;

    // ── Date filter — only apply if user explicitly set dates ──
    // Parse both as comparable strings (handle DD-MM-YYYY and YYYY-MM-DD)
    if (from || to) {
      const parseDate = d => {
        if (!d) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d; // already YYYY-MM-DD
        const parts = d.split('-');
        if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY → YYYY-MM-DD
        return d;
      };
      const cDate = parseDate(c.fir_date);
      if (cDate) {
        if (from && cDate < from) return false;
        if (to   && cDate > to)   return false;
      }
    }

    // ── No query — passed filters ──
    if (!words.length) return true;

    // ── Party-aware text search (word-level partial match) ──
    const matchComplainant =
      wordMatch(c.fir_number)        ||
      wordMatch(c.section_of_law)    ||
      wordMatch(c.offence_type)      ||
      wordMatch(c.complainant)       ||
      wordMatchClean(c.complainant_cnic) ||
      wordMatchClean(c.complainant_cell);

    const matchAccused =
      wordMatch(c.fir_number)     ||
      wordMatch(c.section_of_law) ||
      wordMatch(c.offence_type)   ||
      wordMatch(c.accused_name)   ||
      wordMatchClean(c.accused_cnic) ||
      wordMatchClean(c.accused_cell);

    if (party === 'complainant') return matchComplainant;
    if (party === 'accused')     return matchAccused;
    return matchComplainant || matchAccused;
  });

  if (!results.length) {
    res.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text-muted);">
        <div style="font-size:32px;margin-bottom:10px;">🔍</div>
        <div style="font-weight:600;">No cases found</div>
        <div style="font-size:12px;margin-top:4px;">Try different search terms or adjust filters</div>
      </div>`;
    return;
  }

  res.innerHTML = `
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;padding:0 2px;">
      ${results.length} case${results.length !== 1 ? 's' : ''} found
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;min-width:780px;">
      <thead><tr>
        <th>FIR No.</th>
        <th>Complainant</th>
        <th>CNIC</th>
        <th>Cell No.</th>
        <th>Section / Offence</th>
        <th>Station</th>
        <th>Status</th>
        <th>Date</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${results.map(c => `<tr>
          <td><span style="font-weight:800;color:var(--accent);cursor:pointer;"
              onclick="openCaseWorkspace('${c.id}')">${c.fir_number || '—'}</span></td>
          <td style="font-size:12px;">${c.complainant || '—'}</td>
          <td style="font-family:var(--font-mono);font-size:11px;">${formatCNIC(c.complainant_cnic) || '—'}</td>
          <td style="font-family:var(--font-mono);font-size:11px;">${formatCell(c.complainant_cell) || '—'}</td>
          <td style="font-size:11px;">${[c.section_of_law, c.offence_type].filter(Boolean).join(' / ') || '—'}</td>
          <td style="font-size:11px;">${c.case_station || '—'}</td>
          <td><span class="pill ${STATUS_CLASSES[c.status] || 'pill-blue'}">${STATUS_LABELS[c.status] || c.status}</span></td>
          <td style="font-size:11px;white-space:nowrap;">${c.fir_date || '—'}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-secondary btn-sm" onclick="openCaseWorkspace('${c.id}')">📄</button>
            <button class="btn btn-secondary btn-sm" onclick="openEditCaseModal('${c.id}')">✏️</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}
