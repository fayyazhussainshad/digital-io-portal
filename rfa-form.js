/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — RFA فارم  (Request for Assistance)
   Annex-A (RFA details) · Annex-B (assistance requested) · Annex-C (feedback)
   • A4 fixed page size · English lines LTR + left aligned
   • Urdu text → Jameel Noori Nastaleeq
   • Database: table `rfa_forms` — ek مقدمے میں کئی RFA (history) محفوظ
     ہوتی ہیں، فہرست سے پرانی کھول/بدل سکتے ہیں۔
   ═══════════════════════════════════════════════════════════ */

let _rfaCaseId  = null;
let _rfaCase    = null;
let _rfaList    = [];     // saved RFA rows for this case (history)
let _rfaCurrent = null;   // the RFA being edited (null = new)
let _rfaDirty   = false;

// ── OPEN → show list ──────────────────────────────────────────
async function openRfaForm(caseId) {
  _rfaCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _rfaCaseId) {
    try { _rfaCase = await getCase(_rfaCaseId); } catch(_) { _rfaCase = null; }
  }
  await _loadRfaList();
  _renderRfaList();
}

// ── LOAD list of saved RFAs (rfa_forms; localStorage fallback) ──
async function _loadRfaList() {
  _rfaList = [];
  try {
    const { data } = await supabaseClient.from('rfa_forms').select('*')
      .eq('case_id', _rfaCaseId).order('created_at', { ascending: true });
    _rfaList = data || [];
    try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
  } catch(_) {
    try { _rfaList = JSON.parse(localStorage.getItem('dio_rfalist_' + _rfaCaseId) || '[]'); }
    catch(_2) { _rfaList = []; }
  }
}

// ── RENDER: list of previous RFAs + "new" button ──────────────
function _renderRfaList() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  const rows = _rfaList.map((r, i) => {
    const fd = r.form_data || {};
    const no = _rfaStrip(r.rfa_number || fd.a_rfa_no) || ('RFA #' + (i + 1));
    const purpose = _rfaStrip(fd.a_purpose) || '—';
    const dt = (r.created_at ? String(r.created_at).slice(0, 10) : '');
    const done = r.status === 'complete';
    return `
    <div onclick="_openRfaDoc('${r.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;direction:rtl;"
      onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="font-size:20px;">${done ? '✅' : '📝'}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;direction:ltr;text-align:left;font-family:Arial,sans-serif;">${esc(no)}</div>
        <div style="font-size:13px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">مقصد: ${esc(purpose)} ${dt ? ' · ' + dt : ''}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_rfaDelete('${r.id}')" title="حذف کریں">🗑️</button>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();_openRfaDoc('${r.id}')">کھولیں</button>
    </div>`;
  }).join('');

  area.innerHTML = `
  <div style="padding:16px;direction:rtl;height:100%;overflow-y:auto;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
    <div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid var(--accent);padding-bottom:8px;margin-bottom:14px;">
      <button class="btn btn-secondary btn-sm" onclick="dioGoBack()">← واپس</button>
      <div style="font-size:18px;font-weight:800;color:var(--accent);">RFA فارم — فہرست</div>
      <button class="btn btn-primary btn-sm" style="margin-right:auto;" onclick="_newRfa()">+ نیا RFA فارم</button>
    </div>
    ${_rfaList.length ? rows : `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:10px;">📄</div>
        <div style="font-size:16px;">ابھی کوئی RFA محفوظ نہیں — "نیا RFA فارم" دبائیں</div>
      </div>`}
  </div>`;
}

function _rfaStrip(s) { return (s == null) ? '' : String(s).replace(/<[^>]*>/g, '').trim(); }

// ── new / open existing ───────────────────────────────────────
function _newRfa() { _rfaCurrent = null; _rfaDirty = false; _renderRfaForm(); }
function _openRfaDoc(id) {
  _rfaCurrent = _rfaList.find(r => String(r.id) === String(id)) || null;
  _rfaDirty = false;
  _renderRfaForm();
}
function _rfaBackToList() {
  if (_rfaDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ واپس فہرست پر جائیں؟')) return;
  _renderRfaList();
}

// ── RENDER: the A4 form ───────────────────────────────────────
function _renderRfaForm() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _rfaCase || {};
  const s = (_rfaCurrent && _rfaCurrent.form_data) ? _rfaCurrent.form_data : {};
  const _san = (typeof sanitizeHtml === 'function') ? sanitizeHtml : (x => (x==null?'':String(x)));
  const v = (k, def) => _san((s[k] !== undefined && s[k] !== null && s[k] !== '') ? s[k] : (def || ''));

  const dst = o.district || c.case_district || '';
  const sta = o.station  || c.case_station  || '';
  const fir = c.fir_number || '';
  const ion = o.full_name || '';
  const rnk = o.designation || '';

  const editFont = "font-family:Arial,'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',sans-serif;";
  const rTh  = "border:1px solid #333;padding:6px 9px;background:#ececec;font-weight:700;text-align:left;font-size:12.5px;font-family:Arial,sans-serif;";
  const rThC = rTh.replace('text-align:left', 'text-align:center');
  const rTd  = "border:1px solid #333;padding:6px 9px;font-size:12.5px;text-align:left;font-family:Arial,sans-serif;vertical-align:middle;";
  const rTdC = rTd.replace('text-align:left', 'text-align:center');
  const ec = (k, def) => `<td contenteditable="true" data-k="${k}" oninput="_rfaBold(this)" style="border:1px solid #333;padding:6px 9px;font-size:12.5px;text-align:left;${editFont}unicode-bidi:plaintext;${v(k,def)?'font-weight:bold;':''}">${v(k, def)}</td>`;

  const pageStyle = "width:210mm;min-height:297mm;box-sizing:border-box;margin:0 auto 18px;padding:16mm 15mm;background:#fff;color:#111;direction:ltr;text-align:left;font-family:Arial,'Times New Roman',sans-serif;font-size:13px;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:3px;";

  const headBlock = (annex) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:2px;">
      <span style="font-weight:bold;font-size:15px;">Police Department</span>
      <span style="font-weight:bold;font-size:15px;">District ${esc(dst)}</span>
    </div>
    <div style="text-align:right;font-size:12px;font-style:italic;margin:2px 0;">${annex}</div>`;

  const aRows = [
    ['1','RFA Number','a_rfa_no',''],
    ['2','Requesting District','a_req_dist', dst],
    ['3','Date of Request','a_date_req',''],
    ['4','Date when Assistance is Needed','a_date_need',''],
    ['5','Date of Expiry of Request','a_date_exp',''],
    ['6','Case FIR No.','a_fir', fir],
    ['7','Police Station','a_ps', sta],
    ['8','Assisting District','a_assist_dist',''],
    ['9','Police Station of Mission Jurisdiction','a_mission_ps',''],
    ['10','Purpose of Request','a_purpose',''],
    ['11','Name of Officer Requesting Assistance','a_officer', ion],
    ['12','Rank','a_rank', rnk],
    ['13','Posting','a_posting', sta],
    ['14','Cell Phone of the Officer','a_cell',''],
    ['15','Status','a_status',''],
  ];
  const bRows = [
    ['1','Upper Subordinates','b_upper'],
    ['2','Lower Subordinates','b_lower'],
    ['3','Vehicles','b_vehicles'],
    ['4','Elite Teams','b_elite'],
    ['5','Locator','b_locator'],
    ['6','Other','b_other'],
  ];
  const cRows = [
    ['1','Has the request been completed? Yes / No','c_completed'],
    ['2','Date of completion','c_date'],
    ['3','Was the assistance provided? Yes / No','c_provided'],
    ['4','Check the items requested for assistance','c_items'],
    ['5','Was the purpose of mission achieved?','c_purpose'],
    ['6','If No, what was the reason?','c_reason'],
  ];

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:ltr;">
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
      <button class="btn btn-secondary btn-sm" onclick="_rfaBackToList()">← واپس فہرست</button>
      <div style="font-weight:700;font-size:14px;">RFA فارم ${_rfaCurrent ? '(ترمیم)' : '(نیا)'}</div>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveRfa()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_printRfa()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="rfa-doc" oninput="_rfaDirty=true">

        <!-- ═══ PAGE 1 — Annex-A + Annex-B ═══ -->
        <div class="rfa-page" style="${pageStyle}">
          ${headBlock('Annex-A')}
          <div style="text-align:center;font-size:17px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Request for Assistance (RFA)</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:26px;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:44%;">Particulars</th><th style="${rTh}">Details</th></tr>
            ${aRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}font-weight:600;">${r[1]}</td>${ec(r[2], r[3])}</tr>`).join('')}
          </table>

          ${headBlock('Annex-B')}
          <div style="text-align:center;font-size:16px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Assistance Requested in the RFA</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:56%;">Item</th><th style="${rTh}">Number / Quantity</th></tr>
            ${bRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}">${r[1]}</td>${ec(r[2],'')}</tr>`).join('')}
          </table>

          <div style="margin-bottom:6px;">Forwarded please,</div>
          <div style="display:flex;justify-content:space-between;margin-top:44px;">
            <div style="text-align:left;">
              <div><b>${esc(ion)}${rnk?(', '+esc(rnk)):''}</b></div>
              <div>P.S ${esc(sta)}.</div>
            </div>
            <div style="text-align:left;">
              <div>&nbsp;</div>
              <div>SI/SHO PS ${esc(sta)}.</div>
            </div>
          </div>
        </div>

        <!-- ═══ PAGE 2 — Annex-C Feedback ═══ -->
        <div class="rfa-page" style="${pageStyle}">
          ${headBlock('Annex-C')}
          <div style="text-align:center;font-size:17px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Feedback Form</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:56%;">Question</th><th style="${rTh}">Feedback</th></tr>
            ${cRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}">${r[1]}</td>${ec(r[2],'')}</tr>`).join('')}
          </table>
        </div>

      </div>
    </div>
  </div>`;
}

function _rfaBold(el) {
  if (!el) return;
  const t = (el.innerText || el.textContent || '').trim();
  el.style.fontWeight = t ? 'bold' : 'normal';
}

// ── COLLECT ───────────────────────────────────────────────────
function _collectRfa() {
  const doc = document.getElementById('rfa-doc');
  const data = {};
  if (doc) doc.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.innerHTML; });
  return data;
}

// ── SAVE (insert new / update existing in rfa_forms) ──────────
async function _saveRfa() {
  if (!_rfaCaseId) { showToast('❌ مقدمہ منتخب نہیں', 'error'); return; }
  const form_data = _collectRfa();
  const rfa_number = _rfaStrip(form_data.a_rfa_no) || null;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    let saved = null;
    if (_rfaCurrent && _rfaCurrent.id && String(_rfaCurrent.id).indexOf('tmp_') !== 0) {
      const { data, error } = await supabaseClient.from('rfa_forms')
        .update({ rfa_number, status: 'complete', form_data })
        .eq('id', _rfaCurrent.id).select().single();
      if (error) throw error;
      saved = data;
    } else {
      const rec = { case_id: _rfaCaseId, rfa_number, status: 'complete', form_data };
      if (oid) rec.officer_id = oid;
      const { data, error } = await supabaseClient.from('rfa_forms')
        .insert(rec).select().single();
      if (error) throw error;
      saved = data;
    }
    _rfaCurrent = saved;
    // update in-memory list
    const idx = _rfaList.findIndex(r => String(r.id) === String(saved.id));
    if (idx >= 0) _rfaList[idx] = saved; else _rfaList.push(saved);
    try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
    // keep misal chip green
    try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch(_) {}
    try {
      if (typeof dioRegisterSaved === 'function')
        dioRegisterSaved('rfa', 'RFA فارم', { case_id: _rfaCaseId, rfa_id: saved.id });
    } catch(_) {}
    _rfaDirty = false;
    showToast('✅ RFA فارم محفوظ ہو گیا', 'success');
  } catch(e) {
    // Offline fallback — cache locally so data isn't lost
    try {
      const tmp = { id: (_rfaCurrent && _rfaCurrent.id) || ('tmp_' + Date.now()),
                    case_id: _rfaCaseId, rfa_number, status: 'complete', form_data,
                    created_at: new Date().toISOString() };
      const idx = _rfaList.findIndex(r => String(r.id) === String(tmp.id));
      if (idx >= 0) _rfaList[idx] = tmp; else _rfaList.push(tmp);
      _rfaCurrent = tmp;
      localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList));
      showToast('⚠️ آف لائن محفوظ (انٹرنیٹ آنے پر سنک کریں)', 'info');
    } catch(_) { showToast('❌ ' + e.message, 'error'); }
  }
}

// ── DELETE ────────────────────────────────────────────────────
async function _rfaDelete(id) {
  if (!confirm('یہ RFA فارم حذف کر دیا جائے؟')) return;
  try {
    if (String(id).indexOf('tmp_') !== 0)
      await supabaseClient.from('rfa_forms').delete().eq('id', id);
  } catch(e) { showToast('❌ ' + e.message, 'error'); return; }
  _rfaList = _rfaList.filter(r => String(r.id) !== String(id));
  try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
  try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch(_) {}
  showToast('🗑️ حذف ہو گیا', 'success');
  _renderRfaList();
}

// ── PRINT (A4, both pages) ────────────────────────────────────
function _printRfa() {
  const doc = document.getElementById('rfa-doc');
  if (!doc) return;
  const html = `<!DOCTYPE html><html dir="ltr"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{ size:A4; margin:14mm; }
      body{ font-family:Arial,'Times New Roman',sans-serif; direction:ltr; text-align:left; font-size:12.5px; color:#111; margin:0; }
      table{ border-collapse:collapse; width:100%; }
      td,th{ border:1px solid #333; padding:6px 9px; }
      .rfa-page{ page-break-after:always; box-shadow:none !important; border-radius:0 !important;
                 width:auto !important; min-height:auto !important; padding:0 !important; margin:0 !important; }
      .rfa-page:last-child{ page-break-after:auto; }
    </style></head><body>${doc.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 400); }
}
