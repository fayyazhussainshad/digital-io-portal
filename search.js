/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — GLOBAL SEARCH (v5 — clean, fast, full-system)
   ═══════════════════════════════════════════════════════════ */

registerPage('search', renderSearch);

const _SEARCH_HISTORY_KEY = 'digital_io_search_history';
let _searchDebounce = null;

function renderSearch(container) {
  container.innerHTML = `
  <div style="max-width:800px;margin:0 auto;padding:8px 0;direction:rtl;">
    <div style="margin-bottom:12px;">
      <button onclick="showPage('dashboard',null)" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:14px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;">↩ واپس</button>
    </div>
    <div id="sr-page-searchbar" style="position:relative;margin-bottom:14px;">
      <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:18px;pointer-events:none;">🔍</span>
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
  if (!q) { _renderSearchHistory(); return; }
  const box = document.getElementById('sr-results');
  if (box) box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);"><div style="font-size:28px;">⏳</div><div style="font-size:14px;margin-top:8px;">تلاش ہو رہی ہے...</div></div>`;
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
    box.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:10px;">🔍</div><div style="font-size:15px;">تلاش کرنے کے لیے اوپر لکھیں</div><div style="font-size:12px;margin-top:6px;">مقدمات، ملزمان، گواہان، ضمنی، سب کچھ</div></div>`;
    return;
  }
  box.innerHTML = `
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">پچھلی تلاش:</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
      ${h.map(q => `<span onclick="_srFromHistory('${q.replace(/'/g,"\\'")}')" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:16px;padding:6px 14px;font-size:14px;cursor:pointer;color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">🕐 ${q}</span>`).join('')}
    </div>
    <button onclick="_clearSearchHistory()" style="background:none;border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;color:var(--text-muted);cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;">🗑️ تاریخ صاف کریں</button>`;
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
    if (box) box.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">${!navigator.onLine?'آف لائن — تلاش کے لیے انٹرنیٹ درکار ہے':'لاگ ان مکمل ہو رہا ہے...'}</div>`;
    return;
  }
  const w = `%${q}%`;
  const S = supabaseClient;
  let caseIds = [];
  try {
    const { data: cs } = await S.from('cases').select('id').eq('officer_id', oid);
    caseIds = (cs || []).map(c => c.id);
  } catch(_) {}

  const queries = [
    S.from('cases').select('id,fir_number,offence_type,section_of_law,complainant,occurrence_place').eq('officer_id', oid).or(`fir_number.ilike.${w},offence_type.ilike.${w},section_of_law.ilike.${w},complainant.ilike.${w},occurrence_place.ilike.${w}`).limit(10),
    S.from('case_accused').select('id,case_id,name,cnic,mobile,pesha').or(`name.ilike.${w},cnic.ilike.${w},mobile.ilike.${w},pesha.ilike.${w}`).limit(10),
    S.from('case_witnesses').select('id,case_id,full_name,cnic,cell,profession').or(`full_name.ilike.${w},cnic.ilike.${w},cell.ilike.${w},profession.ilike.${w}`).limit(10),
    S.from('fir_matn').select('id,case_id,matn').ilike('matn', w).limit(10),
    S.from('zimni_reports').select('id,case_id,serial_no,content').limit(10),
    S.from('hamrahi_mulazman').select('id,case_id,name,rank,service_number,cnic,mobile').or(`name.ilike.${w},rank.ilike.${w},service_number.ilike.${w},cnic.ilike.${w},mobile.ilike.${w}`).limit(10),
    S.from('sarkari_gari').select('id,case_id,vehicle_number,driver_name').or(`vehicle_number.ilike.${w},driver_name.ilike.${w}`).limit(10),
    S.from('cdr_imei_requests').select('id,case_id,diary_number').ilike('diary_number', w).limit(10),
  ];

  const results = await Promise.allSettled(queries);
  const [casesR, accusedR, witnessR, firR, zimniR, hamrahiR, gariR, cdrR] = results.map(r => r.status === 'fulfilled' ? (r.value.data || []) : []);

  const mine = (arr) => caseIds.length ? arr.filter(x => caseIds.includes(x.case_id)) : arr;
  const acc = mine(accusedR);
  const wit = mine(witnessR);
  const fir = mine(firR);
  const zim = mine(zimniR).filter(z => JSON.stringify(z.content||'').toLowerCase().includes(q.toLowerCase()));
  const ham = hamrahiR || [];
  const gari = gariR || [];
  const cdr = mine(cdrR);

  _renderSearchResults(q, { cases: casesR, accused: acc, witnesses: wit, fir, zimni: zim, hamrahi: ham, gari, cdr });
}

function _renderSearchResults(q, r) {
  const box = document.getElementById('sr-results');
  if (!box) return;
  const total = r.cases.length + r.accused.length + r.witnesses.length + r.fir.length + r.zimni.length
              + (r.hamrahi?.length||0) + (r.gari?.length||0) + (r.cdr?.length||0);
  if (!total) {
    box.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);"><div style="font-size:40px;margin-bottom:10px;">🔍</div><div style="font-size:15px;">"${q}" کے لیے کچھ نہیں ملا</div></div>`;
    return;
  }
  const card = (label, color, title, sub, onclick) => `
    <div onclick="${onclick}" style="background:var(--bg-card);border:1px solid var(--border);border-right:3px solid ${color};border-radius:8px;padding:11px 13px;margin-bottom:7px;cursor:pointer;direction:rtl;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="background:${color};color:#fff;border-radius:6px;padding:2px 8px;font-size:12px;white-space:nowrap;">${label}</span>
        <span style="font-weight:700;font-size:15px;font-family:'Jameel Noori Nastaleeq',serif;">${title}</span>
      </div>
      ${sub?`<div style="font-size:13px;color:var(--text-muted);margin-top:4px;">${sub}</div>`:''}
    </div>`;
  let html = `<div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">${total} نتائج ملے</div>`;
  r.cases.forEach(c => html += card('مقدمہ','var(--accent)', `FIR ${c.fir_number||'—'}`, `${c.offence_type||''} ${c.section_of_law||''} · ${c.complainant||''}`, `openCaseWorkspace('${c.id}')`));
  r.accused.forEach(a => html += card('ملزم','#f97316', a.name||'—', `${a.cnic||''} ${a.mobile||''} ${a.pesha||''}`, a.case_id?`openCaseWorkspace('${a.case_id}')`:''));
  r.witnesses.forEach(wt => html += card('گواہ','#a78bfa', wt.full_name||'—', `${wt.cnic||''} ${wt.cell||''} ${wt.profession||''}`, wt.case_id?`openCaseWorkspace('${wt.case_id}')`:''));
  r.fir.forEach(f => html += card('FIR متن','var(--green)', 'الف آئی آر متن', (f.matn||'').slice(0,80)+'...', f.case_id?`openCaseWorkspace('${f.case_id}')`:''));
  r.zimni.forEach(z => html += card('ضمنی','#0ea5e9', `ضمنی نمبر ${z.serial_no||''}`, '', z.case_id?`openCaseWorkspace('${z.case_id}')`:''));
  (r.hamrahi||[]).forEach(h => html += card('ہمراہی ملازم','#14b8a6', h.name||'—', `${h.rank||''} ${h.service_number||''} ${h.cnic||''} ${h.mobile||''}`, h.case_id?`openCaseWorkspace('${h.case_id}')`:''));
  (r.gari||[]).forEach(g => html += card('سرکاری گاڑی','#64748b', g.vehicle_number||'—', `ڈرائیور: ${g.driver_name||''}`, g.case_id?`openCaseWorkspace('${g.case_id}')`:''));
  (r.cdr||[]).forEach(cd => html += card('CDR/IMEI','#8b5cf6', `ڈائری ${cd.diary_number||''}`, '', cd.case_id?`openCaseWorkspace('${cd.case_id}')`:''));
  box.innerHTML = html;
}
