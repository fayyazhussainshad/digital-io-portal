/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — WITNESSES / PERSONS (per case, universal)
   Compact horizontal strip cards + cross-reference
   FORM FIELDS unchanged — format/font/settings mirrored from
   mulziman.js (centered Nastaliq labels, centered inputs, grid,
   CNIC/phone auto-format, keyboard navigation).
   ═══════════════════════════════════════════════════════════ */

// Default witness status options (officer can add custom via +)
const WITNESS_STATUS = [
  { v:'fir_eye',  label:'FIR چشم دید' },
  { v:'tatima',   label:'تتمہ بیان' },
  { v:'fard',     label:'فرد' },
  { v:'mazroob',  label:'مضروب' },
  { v:'victim',   label:'Victim' },
  { v:'maghvi',   label:'مغوی' },
  { v:'mudai',    label:'مدعی' },
  { v:'moharrir', label:'محرر / FIR writer' },
];

let _witnessList = [];
let _witnessCaseId = null;
let _editingWitnessId = null;
let _witnessFormType = 'fir';

let _personMode = 'witness'; // 'witness' or 'accused'
let _witnessViewType = 'fir';

async function openWitnessesCard(caseId, type) {
  _personMode = 'witness';
  _witnessViewType = type || 'fir';
  _witnessFormType = _witnessViewType;
  _witnessCaseId = caseId || _misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadWitnesses();
  _renderWitnessesArea();
}

// openAccusedCard moved to mulziman.js (dedicated accused module)

async function _loadWitnesses() {
  try {
    const { data } = await supabaseClient
      .from('case_witnesses').select('*')
      .eq('case_id', _witnessCaseId)
      .order('created_at', { ascending: true });
    _witnessList = data || [];
  } catch(_) { _witnessList = []; }
}

// ── FORM CSS (injected once — mirrors mulziman's acc-form styling) ──
function _witInjectCSS() {
  if (document.getElementById('wit-form-css')) return;
  const s = document.createElement('style');
  s.id = 'wit-form-css';
  s.textContent = `
  .wit-form{direction:rtl;text-align:right;}
  .wit-form .wit-label{
    display:block;font-size:14pt;font-weight:700;text-align:center;
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
    margin:8px 0 4px;color:var(--text,#111);line-height:1.6;
  }
  .wit-form .wit-field{display:flex;flex-direction:column;}
  .wit-form .wit-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 10px;align-items:start;}
  .wit-form .wit-grid5{display:grid;grid-template-columns:2.6fr 1.6fr 1.4fr 1fr 1.2fr;gap:6px 8px;align-items:start;}
  .wit-form .form-input{width:100%;box-sizing:border-box;font-size:14pt;}
  .wit-form select.form-input,.wit-form input.form-input{text-align:center;font-size:14pt;}
  @media(max-width:640px){.wit-form .wit-grid5{grid-template-columns:1fr 1fr;}}
  @media(max-width:560px){.wit-form .wit-grid3{grid-template-columns:1fr 1fr;}}
  `;
  document.head.appendChild(s);
}

function _renderWitnessesArea() {
  _witInjectCSS();
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const isCross = _witnessViewType === 'cross_version';
  const list = _witnessList.filter(w => (w.witness_type || 'fir') === _witnessViewType);
  const heading = isCross ? 'گواہان کراس ورژن' : 'گواہان FIR';
  const color = isCross ? 'var(--amber)' : 'var(--accent)';
  area.innerHTML = `
  <div style="padding:10px;direction:rtl;height:100%;overflow-y:auto;width:100%;box-sizing:border-box;">
    <div id="witness-form-box"></div>
    <div style="font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:${color};border-bottom:2px solid ${color};padding-bottom:6px;margin-bottom:12px;text-align:right;width:100%;box-sizing:border-box;">${heading}</div>
    <div style="width:100%;">${_renderWitnessList(list, _witnessViewType)}</div>
    <div style="margin-top:12px;text-align:right;">
      <button class="btn btn-primary btn-sm" onclick="_openWitnessForm(null,'${_witnessViewType}')">➕ گواہ</button>
    </div>
  </div>`;
}

// Built-in case persons who are automatically considered witnesses:
// مدعی (complainant), محرر/FIR writer, مضروب/مغوی/victim if recorded on the case
async function _saveAutoWitnesses(auto) {
  if (!auto || !auto.length) return;
  try {
    const oid = await getOfficerId();
    let added = 0;
    for (const a of auto) {
      // Skip if a witness with same name already exists
      if (_witnessList.some(w => (w.full_name||'').trim() === (a.name||'').trim())) continue;
      await supabaseClient.from('case_witnesses').insert({
        case_id: _witnessCaseId, officer_id: oid,
        full_name: a.name, cnic: a.cnic||null, cell: a.cell||null,
        status: a.role || 'گواہ',
      });
      added++;
    }
    await _loadWitnesses();
    _renderWitnessesArea();
    showToast(added ? `✅ ${added} فریقین گواہان میں شامل ہو گئے` : 'یہ پہلے ہی شامل ہیں', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// Compact single-row strips
function _renderWitnessList(list, type) {
  list = list || _witnessList;
  if (!list.length) {
    return `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:14px;">کوئی گواہ شامل نہیں</div>`;
  }
  return list.map((w, i) => {
    const statusLabel = (WITNESS_STATUS.find(s => s.v === w.status) || {}).label || w.status || '—';
    return `
    <div style="display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-right:3px solid var(--accent);border-radius:8px;padding:10px 12px;margin-bottom:7px;direction:rtl;font-size:14px;flex-wrap:nowrap;overflow-x:auto;">
      <span style="font-weight:800;color:var(--accent);white-space:nowrap;">گواہ ${i+1}</span>
      <span style="font-weight:700;white-space:nowrap;font-family:'Jameel Noori Nastaleeq',serif;">${esc(w.full_name)||'—'}</span>
      ${w.cnic?`<span style="color:var(--text-muted);direction:ltr;white-space:nowrap;">${esc(w.cnic)}</span>`:''}
      ${w.cell?`<span style="color:var(--text-muted);direction:ltr;white-space:nowrap;">${esc(w.cell)}</span>`:''}
      ${w.profession?`<span style="color:var(--text-muted);white-space:nowrap;">${esc(w.profession)}</span>`:''}
      <span style="background:var(--accent-glow);color:var(--accent);border-radius:10px;padding:2px 8px;white-space:nowrap;font-size:13px;">${statusLabel}</span>
      <span style="flex:1;"></span>
      <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openWitnessForm('${w.id}')">✏️</button>
      <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteWitness('${w.id}')">🗑️</button>
    </div>`;
  }).join('');
}

// ── ADD / EDIT FORM (fields unchanged — mulziman format/font/settings) ──
function _openWitnessForm(id, type) {
  _witInjectCSS();
  _editingWitnessId = id || null;
  _witnessFormType = type || (id ? (_witnessList.find(x=>x.id===id)||{}).witness_type : null) || 'fir';
  const w = id ? (_witnessList.find(x => x.id === id) || {}) : {};
  const box = document.getElementById('witness-form-box');
  if (!box) return;
  box.innerHTML = `
  <div class="card" style="padding:12px 14px;border:1px solid var(--accent);margin:0 0 12px;">
    <div class="wit-form">
      <div style="font-size:16px;font-weight:800;color:var(--accent);text-align:center;margin-bottom:4px;font-family:'Jameel Noori Nastaleeq',serif;">${id?'✏️ گواہ کی ترمیم':'➕ نیا گواہ'}</div>

      <!-- نام | شناختی کارڈ | فون نمبر | پیشہ | حیثیت (سب ایک لائن) -->
      <div class="wit-grid5">
        <div class="wit-field">
          <label class="wit-label">نام</label>
          <input class="form-input" id="w-name" value="${_escW(w.full_name)}" placeholder="پورا نام" oninput="_checkPriorRecord(this.value)">
        </div>
        <div class="wit-field">
          <label class="wit-label">شناختی کارڈ</label>
          <input class="form-input" id="w-cnic" dir="ltr" maxlength="15" value="${_escW(w.cnic)}" placeholder="00000-0000000-0" oninput="_witFmtCnic(this);_checkPriorByContact()">
        </div>
        <div class="wit-field">
          <label class="wit-label">فون نمبر</label>
          <input class="form-input" id="w-cell" dir="ltr" maxlength="12" value="${_escW(w.cell)}" placeholder="0000-0000000" oninput="_witFmtMobile(this);_checkPriorByContact()">
        </div>
        <div class="wit-field">
          <label class="wit-label">پیشہ</label>
          <input class="form-input" id="w-profession" value="${_escW(w.profession)}" placeholder="پیشہ">
        </div>
        <div class="wit-field">
          <label class="wit-label">حیثیت</label>
          <div style="display:flex;gap:4px;align-items:stretch;">
            <select class="form-input" id="w-status" style="flex:1;min-width:0;">
              ${WITNESS_STATUS.map(s => `<option value="${s.v}" ${w.status===s.v?'selected':''}>${s.label}</option>`).join('')}
              ${w.status && !WITNESS_STATUS.find(s=>s.v===w.status) ? `<option value="${w.status}" selected>${w.status}</option>` : ''}
            </select>
            <button class="btn btn-secondary btn-sm" style="flex-shrink:0;padding:0 8px;" onclick="_addCustomStatus()" title="نیا اسٹیٹس">➕</button>
          </div>
        </div>
      </div>

      <div id="w-prior-record" style="margin-top:8px;"></div>

      <div style="display:flex;gap:8px;margin-top:14px;justify-content:center;">
        <button class="btn btn-primary" onclick="_saveWitness()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary" onclick="document.getElementById('witness-form-box').innerHTML=''">منسوخ</button>
      </div>
    </div>
  </div>`;
  box.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── CNIC / Phone auto-format (copied from mulziman settings) ───
function _witFmtCnic(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 13);
  if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
  if (v.length > 13) v = v.slice(0,13) + '-' + v.slice(13);
  el.value = v;
}
function _witFmtMobile(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 4) v = v.slice(0,4) + '-' + v.slice(4);
  el.value = v;
}

// ── KEYBOARD NAVIGATION (mirrors mulziman: Tab / Arrow / Space) ──
function _witKeyNav(e) {
  const form = document.querySelector('.wit-form');
  if (!form || !form.contains(e.target)) return;
  const t = e.target;
  const k = e.key;

  const els = Array.from(form.querySelectorAll('input, select, button, textarea'))
    .filter(el => !el.disabled && el.type !== 'file' && el.getClientRects().length);
  const i = els.indexOf(t);

  if (k === 'ArrowDown') {
    if (i > -1 && i < els.length - 1) { e.preventDefault(); els[i + 1].focus(); }
  } else if (k === 'ArrowUp') {
    if (i > 0) { e.preventDefault(); els[i - 1].focus(); }
  } else if (k === ' ' || k === 'Spacebar' || k === 'Space') {
    if (t.tagName === 'SELECT') {
      if (typeof t.showPicker === 'function') { e.preventDefault(); try { t.showPicker(); } catch(_) {} }
    } else if (t.tagName === 'BUTTON') {
      e.preventDefault(); t.click();
    }
    // text/date inputs: space types normally
  }
  // Tab / Shift+Tab: native handling walks every field in order
}
if (typeof window !== 'undefined' && !window._witKeyNavBound) {
  document.addEventListener('keydown', _witKeyNav, true);
  window._witKeyNavBound = true;
}

// Add a custom status option to the dropdown
function _addCustomStatus() {
  const val = prompt('نیا اسٹیٹس درج کریں:');
  if (!val || !val.trim()) return;
  const sel = document.getElementById('w-status');
  if (!sel) return;
  const opt = document.createElement('option');
  opt.value = val.trim(); opt.textContent = val.trim(); opt.selected = true;
  sel.appendChild(opt);
}

// ── CROSS-REFERENCE ───────────────────────────────────────────
let _priorCheckTimer = null;
function _checkPriorRecord(name) {
  clearTimeout(_priorCheckTimer);
  _priorCheckTimer = setTimeout(() => _doPriorCheck(name, null, null), 500);
}
function _checkPriorByContact() {
  const cnic = document.getElementById('w-cnic')?.value.trim();
  const cell = document.getElementById('w-cell')?.value.trim();
  clearTimeout(_priorCheckTimer);
  _priorCheckTimer = setTimeout(() => _doPriorCheck(null, cnic, cell), 500);
}

async function _doPriorCheck(name, cnic, cell) {
  const box = document.getElementById('w-prior-record');
  if (!box) return;
  name = (name || '').trim().toLowerCase();
  cnic = (cnic || '').replace(/\D/g, '');
  cell = (cell || '').replace(/\D/g, '');
  if (!name && cnic.length < 10 && cell.length < 7) { box.innerHTML = ''; return; }
  try {
    const oid = await getOfficerId();
    const { data: persons } = await supabaseClient.from('suspects').select('*').eq('officer_id', oid);
    const matchP = (persons || []).filter(p => {
      const pn=(p.full_name||'').toLowerCase(), pc=(p.cnic||'').replace(/\D/g,''), pe=(p.cell||'').replace(/\D/g,'');
      return (name && pn===name) || (cnic.length>=10 && pc===cnic) || (cell.length>=7 && pe===cell);
    });
    const { data: cases } = await supabaseClient.from('cases').select('*').eq('officer_id', oid);
    const matchC = (cases || []).filter(c => {
      const cn=(c.complainant||'').toLowerCase(), cc=(c.complainant_cnic||'').replace(/\D/g,''), ce=(c.complainant_cell||'').replace(/\D/g,'');
      return (name && cn===name) || (cnic.length>=10 && cc===cnic) || (cell.length>=7 && ce===cell);
    });
    if (!matchP.length && !matchC.length) {
      box.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">✓ پہلے کا کوئی ریکارڈ نہیں</div>`;
      return;
    }
    const SUS = (typeof SUSPECT_TYPES !== 'undefined') ? SUSPECT_TYPES : {};
    let html = `<div style="background:rgba(245,158,11,0.1);border:1px solid var(--amber);border-radius:8px;padding:8px;font-size:11px;">
      <div style="font-weight:700;color:var(--amber);margin-bottom:5px;">⚠️ پہلے ریکارڈ موجود ہے:</div>`;
    matchP.forEach(p => {
      const role = (SUS[p.person_type]||{}).label || p.person_type;
      const icon = (SUS[p.person_type]||{}).icon || '•';
      html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 0;">
        <span>${icon} <b>${esc(p.full_name)}</b> — ${role}</span>
        <button class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick='_autoFillWitness(${JSON.stringify(p).replace(/'/g,"&#39;")})'>📋 بھریں</button>
      </div>`;
    });
    matchC.forEach(c => {
      html += `<div style="padding:3px 0;">📢 <b>مدعی</b> FIR ${c.fir_number||'—'} — ${STATUS_LABELS[c.status]||c.status||''}</div>`;
    });
    html += `</div>`;
    box.innerHTML = html;
  } catch(e) { box.innerHTML = ''; }
}

function _autoFillWitness(p) {
  const set=(id,val)=>{const el=document.getElementById(id);if(el&&val)el.value=val;};
  set('w-name',p.full_name); set('w-profession',p.profession);
  set('w-cell',p.cell); set('w-cnic',p.cnic);
  showToast('📋 پچھلا ڈیٹا بھر دیا — ضرورت ہو تو ترمیم کریں','success');
}

async function _saveWitness() {
  const rec = {
    case_id: _witnessCaseId,
    full_name: document.getElementById('w-name')?.value.trim()||null,
    profession: document.getElementById('w-profession')?.value.trim()||null,
    cell: document.getElementById('w-cell')?.value.trim()||null,
    cnic: document.getElementById('w-cnic')?.value.trim()||null,
    status: document.getElementById('w-status')?.value||null,
    witness_type: _witnessFormType || 'fir',
  };
  if (!rec.full_name) { showToast('⚠️ نام ضروری ہے','error'); return; }
  try {
    const oid = await getOfficerId();
    if (oid) rec.officer_id = oid;
    if (_editingWitnessId) {
      await supabaseClient.from('case_witnesses').update(rec).eq('id', _editingWitnessId);
      const idx = _witnessList.findIndex(x => x.id === _editingWitnessId);
      if (idx >= 0) _witnessList[idx] = { ..._witnessList[idx], ...rec };
    } else {
      const { data } = await supabaseClient.from('case_witnesses').insert(rec).select().single();
      const newRec = data ? { ...data, witness_type: data.witness_type || rec.witness_type } : { ...rec, id: 'tmp_'+Date.now() };
      _witnessList.push(newRec);
      try {
        await supabaseClient.from('suspects').insert({
          officer_id: oid, person_type:'witness',
          full_name: rec.full_name, profession: rec.profession,
          cnic: rec.cnic, cell: rec.cell,
        });
      } catch(_) {}
    }
    document.getElementById('witness-form-box').innerHTML = '';
    _witnessFormType = 'fir';  // reset
    await _loadWitnesses();     // reload from DB (gets all records)
    _renderWitnessesArea();
    showToast('✅ گواہ محفوظ ہو گیا','success');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _deleteWitness(id) {
  if (!confirm('کیا آپ یہ گواہ حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('case_witnesses').delete().eq('id', id);
    await _loadWitnesses();
    _renderWitnessesArea();
    showToast('🗑️ حذف ہو گیا','info');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _escW(s) {
  return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
