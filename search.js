/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — GLOBAL SEARCH (v5 — clean, fast, full-system)
   ═══════════════════════════════════════════════════════════ */

registerPage('search', renderSearch);

const _SEARCH_HISTORY_KEY = 'digital_io_search_history';
let _searchDebounce = null;

// FIX v524: ye pehle `_runGlobalSearch` ke ANDAR tha magar `_renderSearchResults`
// bhi ise bulata tha → "ReferenceError: _keepFocus is not defined" (har natije par).
// Natija `#sr-results` mein jata hai, khana alag hai — phir bhi kuch
// browser natija badalne par focus gira dete hain, is liye wapas rakho.
function _keepFocus() {
  try {
    const el = document.getElementById('sr-query');
    if (el && document.activeElement !== el) {
      const p = el.value.length;
      el.focus(); el.setSelectionRange(p, p);
    }
  } catch (_) {}
}

// Dashboard par talaash ka khana hai (v524) — wahan khaali khane par
// "پچھلی تلاش" ki badi khidki nahi, bas natije saaf.
function _srOnDashboard() { return !!document.getElementById('dash-search'); }

function renderSearch(container) {
  container.innerHTML = `
  <div style="max-width:100%;margin:0;direction:rtl;">
    <div class="page-header">
      <div>
        <div class="page-title">تلاش</div>
        <div class="page-subtitle">مقدمات، ملزمان، گواہان، ضمنی، واقعاتی رپورٹس — سب ایک جگہ</div>
      </div>
    </div>
    <div id="sr-page-searchbar" style="position:relative;margin-bottom:14px;">
      <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;"><svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg></span>
      <input id="sr-query" type="text" autocomplete="off"
        placeholder="سب کچھ تلاش کریں — FIR، نام، CNIC، واقعہ، ضمنی، پیشہ..." dir="rtl"
        oninput="_srDebounced()"
        style="width:100%;box-sizing:border-box;padding:14px 46px 14px 14px;background:var(--bg-card);border:2px solid var(--border);border-radius:12px;color:var(--text-primary);font-size:16px;outline:none;font-family:'Jameel Noori Nastaleeq',serif;"
        onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
    </div>
    <div id="sr-results"></div>
  </div>`;
  setTimeout(() => {
    const inp = document.getElementById('sr-query');
    if (inp) inp.focus();
    _renderSearchHistory();
  }, 50);
}

function _srDebounced() {
  const q = document.getElementById('sr-query')?.value.trim() || '';
  clearTimeout(_searchDebounce);
  if (!q) {
    if (_srOnDashboard()) { const b = document.getElementById('sr-results'); if (b) b.innerHTML = ''; }
    else _renderSearchHistory();
    return;
  }
  // Aik-do harf par talaash na chalao — har harf par server chalane se
  // safha sust ho jata tha. Teen harf ya us se ooper par hi chalti hai.
  if (q.length < 3) {
    const b0 = document.getElementById('sr-results');
    if (b0) b0.innerHTML = '<div style="text-align:center;padding:26px;color:var(--text-muted);' +
      'font-size:13px;">\u06a9\u0645 \u0627\u0632 \u06a9\u0645 \u062a\u06cc\u0646 \u062d\u0631\u0648\u0641 \u0644\u06a9\u06be\u06cc\u06ba</div>';
    return;
  }
  const box = document.getElementById('sr-results');
  if (box) box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);"><div style="font-size:28px;"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/></svg></div><div style="font-size:14px;margin-top:8px;">تلاش ہو رہی ہے...</div></div>`;
  _searchDebounce = setTimeout(() => _runGlobalSearch(q), 300);
}

function _getSearchHistory() {
  try { return JSON.parse(localStorage.getItem(_SEARCH_HISTORY_KEY) || '[]'); } catch(_) { return []; }
}
function _addSearchHistory(q) {
  if (!q) return;
  let h = _getSearchHistory().filter(x => x !== q);
  h.unshift(q); h = h.slice(0, 10);
  try { localStorage.setItem(_SEARCH_HISTORY_KEY, JSON.stringify(h)); } catch(_) {}
}
function _clearSearchHistory() {
  try { localStorage.removeItem(_SEARCH_HISTORY_KEY); } catch(_) {}
  _renderSearchHistory();
}
function _renderSearchHistory() {
  const box = document.getElementById('sr-results');
  if (!box) return;
  const h = _getSearchHistory();
  if (!h.length) {
    box.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:10px;"><svg viewBox='0 0 24 24' width='40' height='40' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.42;display:inline-block;vertical-align:middle'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg></div><div style="font-size:15px;">تلاش کرنے کے لیے اوپر لکھیں</div><div style="font-size:12px;margin-top:6px;">مقدمات، ملزمان، گواہان، ضمنی، سب کچھ</div></div>`;
    return;
  }
  box.innerHTML = `
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">پچھلی تلاش:</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
      ${h.map(q => `<span onclick="_srFromHistory('${_dioJsHtml(q)}')" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:16px;padding:6px 14px;font-size:14px;cursor:pointer;color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">${q}</span>`).join('')}
    </div>
    <button onclick="_clearSearchHistory()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;color:var(--text-muted);cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">تاریخ صاف کریں</button>`;
}
function _srFromHistory(q) {
  const inp = document.getElementById('sr-query');
  if (inp) { inp.value = q; _runGlobalSearch(q); }
}

async function _runGlobalSearch(q) {
  _addSearchHistory(q);
  const box = document.getElementById('sr-results');
  const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
  if (!oid || !navigator.onLine) {
    if (box) box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">${!navigator.onLine?'آف لائن — تلاش کے لیے انٹرنیٹ درکار ہے':'لاگ ان مکمل ہو رہا ہے…'}</div>`;
    _keepFocus();
    return;
  }
  // PostgREST filter میں , ( ) خطرناک — ہٹا دو
  const qs = String(q).replace(/[,()]/g, ' ').trim();
  const w = `%${qs}%`;
  /* SYSTEM RULE: شناختی کارڈ 00000-0000000-0 · موبائل 0000-0000000 — تلاش میں بھی۔
     افسر ڈیش کے ساتھ لکھے یا بغیر، دونوں صورت ریکارڈ ملے (پرانا ڈیٹا بغیر ڈیش بھی ہو سکتا ہے)۔ */
  const digits = /^[\d\s-]+$/.test(qs) ? qs.replace(/\D/g, '') : '';
  const fmtC = (d) => d.length > 12 ? d.slice(0,5)+'-'+d.slice(5,12)+'-'+d.slice(12) : d.length > 5 ? d.slice(0,5)+'-'+d.slice(5) : d;
  const fmtM = (d) => d.length > 4 ? d.slice(0,4)+'-'+d.slice(4) : d;
  const cnicOr = (col) => digits.length >= 5
    ? `${col}.ilike.%${fmtC(digits.slice(0,13))}%,${col}.ilike.%${digits}%`
    : `${col}.ilike.${w}`;
  const cellOr = (col) => digits.length >= 5
    ? `${col}.ilike.%${fmtM(digits.slice(0,11))}%,${col}.ilike.%${digits}%`
    : `${col}.ilike.${w}`;
  const S = supabaseClient;
  let caseIds = [];
  try {
    const { data: cs } = await S.from('cases').select('id').eq('officer_id', oid);
    caseIds = (cs || []).map(c => c.id);
  } catch(_) {}

  const queries = [
    S.from('cases').select('id,fir_number,offence_type,section_of_law,complainant,complainant_cnic,complainant_cell,occurrence_place').eq('officer_id', oid).or(`fir_number.ilike.${w},offence_type.ilike.${w},section_of_law.ilike.${w},complainant.ilike.${w},occurrence_place.ilike.${w},${cnicOr('complainant_cnic')},${cellOr('complainant_cell')}`).limit(10),
    S.from('case_accused').select('id,case_id,name,cnic,mobile,pesha').or(`name.ilike.${w},${cnicOr('cnic')},${cellOr('mobile')},pesha.ilike.${w}`).limit(10),
    S.from('case_witnesses').select('id,case_id,full_name,cnic,cell,profession,status').or(`full_name.ilike.${w},${cnicOr('cnic')},${cellOr('cell')},profession.ilike.${w}`).limit(10),
    S.from('fir_matn').select('id,case_id,matn').ilike('matn', w).limit(10),
    S.from('zimni_reports').select('id,case_id,serial_no,content').limit(10),
    S.from('hamrahi_mulazman').select('id,case_id,name,rank,service_number,cnic,mobile').or(`name.ilike.${w},rank.ilike.${w},service_number.ilike.${w},${cnicOr('cnic')},${cellOr('mobile')}`).limit(10),
    S.from('sarkari_gari').select('id,case_id,vehicle_number,driver_name').or(`vehicle_number.ilike.${w},driver_name.ilike.${w}`).limit(10),
    S.from('cdr_imei_requests').select('id,case_id,diary_number').ilike('diary_number', w).limit(10),
    // واقعاتی رپورٹس (v535) — نوعیت، مقام، تفصیل، رپورٹ نمبر
    S.from('incident_reports').select('*').eq('officer_id', oid).or(`report_number.ilike.${w},incident_type.ilike.${w},address.ilike.${w},narrative.ilike.${w}`).order('created_at', { ascending: false }).limit(10),
  ];

  const results = await Promise.allSettled(queries);
  const [casesR, accusedR, witnessR, firR, zimniR, hamrahiR, gariR, cdrR, irR] = results.map(r => r.status === 'fulfilled' ? (r.value.data || []) : []);
  const irErr = results[8] && (results[8].status !== 'fulfilled' || results[8].value.error);

  const mine = (arr) => caseIds.length ? arr.filter(x => caseIds.includes(x.case_id)) : arr;
  const acc = mine(accusedR);
  const wit = mine(witnessR);
  const fir = mine(firR);
  const zim = mine(zimniR).filter(z => JSON.stringify(z.content||'').toLowerCase().includes(q.toLowerCase()));
  // SECURITY FIX (Add 7): hamrahi + gari bhi sirf APNE muqadmaat tak mehdood —
  // baaqi categories ki tarah `mine()` se scope karo (dusre afsar ke record na dikhein).
  const ham = mine(hamrahiR);
  const gari = mine(gariR);
  const cdr = mine(cdrR);

  const ir = _srIncidents(q, irErr ? [] : irR, !!irErr);

  _renderSearchResults(q, { cases: casesR, accused: acc, witnesses: wit, fir, zimni: zim, hamrahi: ham, gari, cdr, ir });
}

/* واقعاتی رپورٹس — سرور کے نتائج + مقامی (آف لائن محفوظ / سرور کی تلاش نہ چلے تو پوری فہرست)
   میں سے بھی، تاکہ کوئی رپورٹ تلاش سے باہر نہ رہے (جملہ خانے: نوعیت، تاریخ، مقام، تفصیل…) */
function _srIrText(r) {
  let d = r && r.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
  d = d || {};
  const f = d.f || {};
  const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  return [r.report_number, r.incident_type, r.incident_date, r.address, r.narrative, r.action_taken,
    ...Object.keys(f).map(k => strip(f[k])), d.caller_name, d.person_name, d.datetime, d.place]
    .map(x => String(x || '')).join(' ').replace(/\s+/g, ' ').toLowerCase();
}
function _srIncidents(q, server, serverFailed) {
  const ql = String(q || '').toLowerCase().trim();
  let local = [];
  try {
    const oid = (typeof currentOfficer !== 'undefined' && currentOfficer && currentOfficer.id) ||
      (JSON.parse(localStorage.getItem('dio_officer_cache') || 'null') || {}).id || 'me';
    local = JSON.parse(localStorage.getItem('dio_irlist_' + oid) || '[]') || [];
  } catch { local = []; }
  const out = (server || []).slice();
  local.filter(r => (serverFailed || r._pending) && _srIrText(r).includes(ql))
    .forEach(r => { if (!out.some(x => String(x.id) === String(r.id))) out.push(r); });
  return out.slice(0, 15);
}
function _srIrCard(r) {
  let d = r && r.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
  d = d || {};
  const f = d.f || {};
  const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const subj = strip(f.nature) || r.incident_type || 'واقعاتی رپورٹ';
  const date = (d.occ_iso ? d.occ_iso.slice(0, 10).split('-').reverse().join('/') : '') || r.incident_date || '';
  const place = strip(f.place) || r.address || '';
  return { title: subj, sub: [date, place].filter(Boolean).join(' · ') };
}
window._srIncidents = _srIncidents;
// incident.js بعد میں (lazy) لوڈ ہوتی ہے — تب تک یہی راستہ: صفحہ کھلے، پھر وہی رپورٹ
if (typeof window.openIncidentReport !== 'function') {
  window.openIncidentReport = function (id) { window._irOpenId = id; if (typeof showPage === 'function') showPage('incident', null); };
}

function _renderSearchResults(q, r) {
  const box = document.getElementById('sr-results');
  if (!box) return;
  const total = r.cases.length + r.accused.length + r.witnesses.length + r.fir.length + r.zimni.length
              + (r.hamrahi?.length||0) + (r.gari?.length||0) + (r.cdr?.length||0) + (r.ir?.length||0);
  if (!total) {
    box.innerHTML = (window.DIO && DIO.states)
      ? DIO.states.empty('search', `"${esc(q)}" کے لیے کچھ نہیں ملا`, 'لفظ بدل کر یا مقدمہ نمبر سے دیکھیں')
      : `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">"${esc(q)}" کے لیے کچھ نہیں ملا</div>`;
    _keepFocus();
    return;
  }
  const card = (label, color, title, sub, onclick) => `
    <div onclick="${onclick}" style="background:var(--bg-card);border:1px solid var(--border);border-right:3px solid ${color};border-radius:8px;padding:11px 13px;margin-bottom:7px;cursor:pointer;direction:rtl;text-align:right;">
      <div style="display:flex;align-items:center;gap:8px;justify-content:flex-start;">
        <span style="background:${color};color:#fff;border-radius:6px;padding:2px 8px;font-size:12px;white-space:nowrap;">${label}</span>
        <span style="font-weight:700;font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;">${esc(title)}</span>
      </div>
      ${sub?`<div style="font-size:13px;color:var(--text-muted);margin-top:4px;direction:rtl;text-align:right;unicode-bidi:plaintext;">${esc(sub)}</div>`:''}
    </div>`;
  let html = `<div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">${total} نتائج ملے</div>`;
  r.cases.forEach(c => html += card('مقدمہ','var(--accent)', `FIR ${c.fir_number||'—'}`, `${c.offence_type||''} ${c.section_of_law||''} · ${c.complainant||''}`, `openCaseWorkspace('${c.id}')`));
  // ملزم — ساتھ تصاویر / شناختی کارڈ دیکھنے کا بٹن
  r.accused.forEach(a => html += card('ملزم','#f97316', a.name||'—', `${a.cnic||''} ${a.mobile||''} ${a.pesha||''}`, a.case_id?`openCaseWorkspace('${a.case_id}')`:'')
    .replace(/<\/div>\s*$/, `<div style="margin-top:6px;"><button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_srShowDocs('case_accused','${a.id}')">تصاویر / شناختی کارڈ</button></div></div>`));
  /* گواہ — مدعی بھی گواہ ہے: مدعی جن مقدمات میں ملے، گواہوں میں «مدعی» نشان کے ساتھ */
  const badge = (t) => `<span style="display:inline-block;margin-inline-start:6px;border:1px solid #7c3aed;color:#7c3aed;background:rgba(124,58,237,.08);border-radius:999px;padding:0 9px 2px;font-size:11pt;font-weight:700;">${t}</span>`;
  const witCard = (title, sub, onclick, isMudai) => card('گواہ','#a78bfa', title, sub, onclick)
    .replace(/(<span style="font-weight:700;font-size:15px;[^>]*>[^<]*<\/span>)/, isMudai ? '$1' + badge('مدعی') : '$1');
  r.witnesses.forEach(wt => html += witCard(wt.full_name||'—', `${wt.cnic||''} ${wt.cell||''} ${wt.profession||''}`, wt.case_id?`openCaseWorkspace('${wt.case_id}')`:'', wt.status === 'mudai'));
  const _ql = String(q).toLowerCase().trim(), _qd = String(q).replace(/\D/g, '');
  r.cases.filter(c => (c.complainant && c.complainant.toLowerCase().includes(_ql)) ||
      (_qd.length >= 5 && ((c.complainant_cnic||'').replace(/\D/g,'').includes(_qd) || (c.complainant_cell||'').replace(/\D/g,'').includes(_qd))))
    .forEach(c => html += witCard(c.complainant||'—', `مقدمہ ${c.fir_number||'—'} کا مدعی · ${c.complainant_cnic||''} ${c.complainant_cell||''}`, `openCaseWorkspace('${c.id}')`, true));
  r.fir.forEach(f => html += card('FIR متن','var(--green)', 'الف آئی آر متن', (f.matn||'').slice(0,80)+'...', f.case_id?`openCaseWorkspace('${f.case_id}')`:''));
  r.zimni.forEach(z => html += card('ضمنی','#0ea5e9', `ضمنی نمبر ${z.serial_no||''}`, '', z.case_id?`openCaseWorkspace('${z.case_id}')`:''));
  (r.hamrahi||[]).forEach(h => html += card('ہمراہی ملازم','#14b8a6', h.name||'—', `${h.rank||''} ${h.service_number||''} ${h.cnic||''} ${h.mobile||''}`, h.case_id?`openCaseWorkspace('${h.case_id}')`:''));
  (r.gari||[]).forEach(g => html += card('سرکاری گاڑی','#64748b', g.vehicle_number||'—', `ڈرائیور: ${g.driver_name||''}`, g.case_id?`openCaseWorkspace('${g.case_id}')`:''));
  (r.cdr||[]).forEach(cd => html += card('CDR/IMEI','#8b5cf6', `ڈائری ${cd.diary_number||''}`, '', cd.case_id?`openCaseWorkspace('${cd.case_id}')`:''));
  (r.ir||[]).forEach(x => { const c = _srIrCard(x); html += card('واقعاتی رپورٹ','#dc2626', c.title, c.sub, `openIncidentReport('${_dioJsHtml(String(x.id))}')`); });
  box.innerHTML = html;
  _keepFocus();
}

// ── تلاش سے ملزم / گواہ کی تصاویر اور شناختی کارڈ (دونوں رخ) ──
async function _srShowDocs(table, id) {
  try {
    const { data, error } = await supabaseClient.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const a = data || {};
    const docs = [];
    const photos = (Array.isArray(a.photos) && a.photos.length) ? a.photos : (a.photo_url ? [a.photo_url] : []);
    photos.forEach((u, i) => u && docs.push({ url: u, label: 'تصویر ' + (i + 1) }));
    if (a.cnic_copy_url) docs.push({ url: a.cnic_copy_url, label: 'شناختی کارڈ — سامنے' });
    if (a.cnic_back_url) docs.push({ url: a.cnic_back_url, label: 'شناختی کارڈ — پیچھے' });
    if (!docs.length) { showToast('اس شخص کی کوئی تصویر یا شناختی کارڈ محفوظ نہیں', 'info'); return; }
    window._srDocs = docs;
    window._srDocName = (window.DIOCard ? DIOCard.coreName(a.name || a.full_name) : (a.name || a.full_name || 'file')) || 'file';
    openModal((a.name || a.full_name || '') + ' — تصاویر', `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;direction:rtl;">${docs.map((d, i) => `
      <div style="text-align:center;cursor:pointer;" onclick="DIOCard.viewer(window._srDocs[${i}].url, window._srDocName.replace(/\\s+/g,'_') + '_${i + 1}', window._srDocs[${i}].label)">
        ${/^data:application\/pdf/.test(d.url) ? '<div style="width:110px;height:110px;border:1px solid var(--border);border-radius:8px;display:grid;place-items:center;">PDF</div>'
          : `<img alt="" src="${esc(d.url)}" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">`}
        <div style="font-size:11pt;color:var(--text-muted);">${esc(d.label)}</div></div>`).join('')}</div>`,
      '<button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>');
  } catch (e) { showToast('' + (e && e.message || e), 'error'); }
}
window._srShowDocs = _srShowDocs;
