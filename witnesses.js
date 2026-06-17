/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — WITNESSES / PERSONS CARD (per case)
   Structured fillable cards with cross-reference to past records
   ═══════════════════════════════════════════════════════════ */

// Witness status options (FIR eye witness, تتمہ بیان, فرد, etc.)
const WITNESS_STATUS = [
  { v:'fir_eye',    label:'FIR (چشم دید گواہ)' },
  { v:'tatima',     label:'تتمہ بیان' },
  { v:'fard',       label:'فرد' },
  { v:'recovery',   label:'گواہ برآمدگی' },
  { v:'identification', label:'گواہ شناخت' },
  { v:'other',      label:'دیگر' },
];

let _witnessList = [];      // witnesses for current case
let _witnessCaseId = null;
let _editingWitnessId = null;

// ── OPEN WITNESSES VIEW (called when گواہان button clicked) ────
async function openWitnessesCard(caseId) {
  _witnessCaseId = caseId || _misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadWitnesses();
  _renderWitnessesArea();
}

async function _loadWitnesses() {
  try {
    const { data } = await supabaseClient
      .from('case_witnesses')
      .select('*')
      .eq('case_id', _witnessCaseId)
      .order('created_at', { ascending: true });
    _witnessList = data || [];
  } catch(_) { _witnessList = []; }
}

// ── RENDER into the workspace editor area ─────────────────────
function _renderWitnessesArea() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  area.innerHTML = `
  <div style="padding:16px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
      <div style="font-size:18px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;">👁️ گواہان</div>
      <button class="btn btn-primary btn-sm" onclick="_openWitnessForm()">➕ نیا گواہ شامل کریں</button>
    </div>

    <!-- Form (hidden until add/edit) -->
    <div id="witness-form-box"></div>

    <!-- List of saved witnesses -->
    <div id="witness-list-box" style="margin-top:16px;">
      ${_renderWitnessList()}
    </div>
  </div>`;
}

function _renderWitnessList() {
  if (!_witnessList.length) {
    return `<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:13px;">ابھی کوئی گواہ شامل نہیں</div>`;
  }
  return _witnessList.map((w, i) => {
    const statusLabel = (WITNESS_STATUS.find(s => s.v === w.status) || {}).label || w.status || '—';
    return `
    <div class="card" style="padding:14px;margin-bottom:10px;border-right:3px solid var(--accent);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="font-size:14px;font-weight:800;color:var(--accent);">گواہ نمبر ${i+1}</div>
        <div style="display:flex;gap:5px;">
          <button class="btn btn-secondary btn-sm" onclick="_openWitnessForm('${w.id}')">✏️ ترمیم</button>
          <button class="btn btn-danger btn-sm" onclick="_deleteWitness('${w.id}')">🗑️</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:12px;">
        ${_wRow('نام', w.full_name)}
        ${_wRow('ولدیت', w.father_name)}
        ${_wRow('ذات', w.caste)}
        ${_wRow('پیشہ', w.profession)}
        ${_wRow('فون', w.cell, true)}
        ${_wRow('شناختی کارڈ', w.cnic, true)}
        ${_wRow('پتہ', w.address)}
        ${_wRow('حیثیت', statusLabel)}
      </div>
    </div>`;
  }).join('');
}

function _wRow(label, val, ltr) {
  if (!val) return '';
  return `<div style="background:var(--bg-secondary);border-radius:6px;padding:5px 8px;">
    <span style="color:var(--text-muted);font-size:10px;">${label}: </span>
    <span style="font-weight:600;${ltr?'direction:ltr;display:inline-block;':''}">${val}</span>
  </div>`;
}

// ── ADD / EDIT FORM ───────────────────────────────────────────
function _openWitnessForm(id) {
  _editingWitnessId = id || null;
  const w = id ? (_witnessList.find(x => x.id === id) || {}) : {};

  const box = document.getElementById('witness-form-box');
  if (!box) return;

  box.innerHTML = `
  <div class="card" style="padding:16px;border:1px solid var(--accent);">
    <div style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:12px;">
      ${id ? '✏️ گواہ کی ترمیم' : '➕ نیا گواہ'}
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div style="grid-column:1/-1;">
        <label class="form-label">نام *</label>
        <input class="form-input" id="w-name" value="${_escW(w.full_name)}" placeholder="پورا نام" oninput="_checkPriorRecord(this.value)">
        <div id="w-prior-record" style="margin-top:6px;"></div>
      </div>
      <div>
        <label class="form-label">ولدیت</label>
        <input class="form-input" id="w-father" value="${_escW(w.father_name)}" placeholder="ولدیت">
      </div>
      <div>
        <label class="form-label">ذات / قوم</label>
        <input class="form-input" id="w-caste" value="${_escW(w.caste)}" placeholder="ذات">
      </div>
      <div>
        <label class="form-label">پیشہ</label>
        <input class="form-input" id="w-profession" value="${_escW(w.profession)}" placeholder="پیشہ">
      </div>
      <div>
        <label class="form-label">فون نمبر</label>
        <input class="form-input" id="w-cell" dir="ltr" value="${_escW(w.cell)}" placeholder="0XXX-XXXXXXX" oninput="_checkPriorByContact()">
      </div>
      <div>
        <label class="form-label">شناختی کارڈ</label>
        <input class="form-input" id="w-cnic" dir="ltr" value="${_escW(w.cnic)}" placeholder="XXXXX-XXXXXXX-X" oninput="_checkPriorByContact()">
      </div>
      <div>
        <label class="form-label">حیثیت (Status)</label>
        <select class="form-input" id="w-status">
          ${WITNESS_STATUS.map(s => `<option value="${s.v}" ${w.status===s.v?'selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>
      <div style="grid-column:1/-1;">
        <label class="form-label">پتہ</label>
        <textarea class="form-input" id="w-address" style="min-height:50px;">${_escW(w.address)}</textarea>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;">
      <button class="btn btn-primary" onclick="_saveWitness()">💾 محفوظ کریں</button>
      <button class="btn btn-secondary" onclick="document.getElementById('witness-form-box').innerHTML=''">منسوخ</button>
    </div>
  </div>`;

  // Scroll to form
  box.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── CROSS-REFERENCE: check if this person appears in past records ──
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
    // 1. Search the suspects/persons database
    const oid = await getOfficerId();
    const { data: persons } = await supabaseClient
      .from('suspects').select('*').eq('officer_id', oid);

    const matchP = (persons || []).filter(p => {
      const pn = (p.full_name||'').toLowerCase();
      const pc = (p.cnic||'').replace(/\D/g,'');
      const pe = (p.cell||'').replace(/\D/g,'');
      return (name && pn && pn === name) ||
             (cnic.length>=10 && pc === cnic) ||
             (cell.length>=7 && pe === cell);
    });

    // 2. Search across cases (as complainant)
    const { data: cases } = await supabaseClient.from('cases').select('*').eq('officer_id', oid);
    const matchC = (cases || []).filter(c => {
      const cn = (c.complainant||'').toLowerCase();
      const cc = (c.complainant_cnic||'').replace(/\D/g,'');
      const ce = (c.complainant_cell||'').replace(/\D/g,'');
      return (name && cn && cn === name) ||
             (cnic.length>=10 && cc === cnic) ||
             (cell.length>=7 && ce === cell);
    });

    if (!matchP.length && !matchC.length) {
      box.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">✓ پہلے کا کوئی ریکارڈ نہیں ملا</div>`;
      return;
    }

    // Build prior-record display + offer auto-fill
    const SUS = (typeof SUSPECT_TYPES !== 'undefined') ? SUSPECT_TYPES : {};
    let html = `<div style="background:rgba(245,158,11,0.1);border:1px solid var(--amber);border-radius:8px;padding:10px;font-size:11px;">
      <div style="font-weight:700;color:var(--amber);margin-bottom:6px;">⚠️ اس شخص کا پہلے ریکارڈ موجود ہے:</div>`;

    matchP.forEach(p => {
      const role = (SUS[p.person_type]||{}).label || p.person_type;
      const roleIcon = (SUS[p.person_type]||{}).icon || '•';
      html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--border);">
        <span>${roleIcon} <b>${p.full_name}</b> — ${role}</span>
        <button class="btn btn-secondary btn-sm" style="font-size:10px;padding:2px 8px;" onclick='_autoFillWitness(${JSON.stringify(p).replace(/'/g,"&#39;")})'>📋 ڈیٹا بھریں</button>
      </div>`;
    });

    matchC.forEach(c => {
      html += `<div style="padding:4px 0;border-bottom:1px solid var(--border);">
        📢 <b>مدعی</b> در FIR ${c.fir_number||'—'} — ${c.section_of_law||''} (${STATUS_LABELS[c.status]||c.status||''})
      </div>`;
    });

    html += `</div>`;
    box.innerHTML = html;
  } catch(e) {
    box.innerHTML = '';
  }
}

// Auto-fill the form from a prior person record (still editable)
function _autoFillWitness(p) {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set('w-name', p.full_name);
  set('w-father', p.father_name);
  set('w-caste', p.caste);
  set('w-profession', p.profession);
  set('w-cell', p.cell);
  set('w-cnic', p.cnic);
  set('w-address', p.address);
  showToast('📋 پچھلا ڈیٹا بھر دیا — ضرورت ہو تو ترمیم کریں', 'success');
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveWitness() {
  const rec = {
    case_id:     _witnessCaseId,
    full_name:   document.getElementById('w-name')?.value.trim() || null,
    father_name: document.getElementById('w-father')?.value.trim() || null,
    caste:       document.getElementById('w-caste')?.value.trim() || null,
    profession:  document.getElementById('w-profession')?.value.trim() || null,
    cell:        document.getElementById('w-cell')?.value.trim() || null,
    cnic:        document.getElementById('w-cnic')?.value.trim() || null,
    address:     document.getElementById('w-address')?.value.trim() || null,
    status:      document.getElementById('w-status')?.value || null,
  };
  if (!rec.full_name) { showToast('⚠️ نام ضروری ہے', 'error'); return; }

  try {
    const oid = await getOfficerId();
    if (_editingWitnessId) {
      await supabaseClient.from('case_witnesses').update(rec).eq('id', _editingWitnessId);
    } else {
      await supabaseClient.from('case_witnesses').insert({ ...rec, officer_id: oid });
      // Also save to the persons/suspects database for future cross-reference
      try {
        await supabaseClient.from('suspects').insert({
          officer_id: oid, person_type: 'witness',
          full_name: rec.full_name, father_name: rec.father_name,
          caste: rec.caste, profession: rec.profession,
          cnic: rec.cnic, cell: rec.cell, address: rec.address,
        });
      } catch(_) {}
    }
    document.getElementById('witness-form-box').innerHTML = '';
    await _loadWitnesses();
    _renderWitnessesArea();
    showToast('✅ گواہ محفوظ ہو گیا', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteWitness(id) {
  if (!confirm('کیا آپ یہ گواہ حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('case_witnesses').delete().eq('id', id);
    await _loadWitnesses();
    _renderWitnessesArea();
    showToast('🗑️ حذف ہو گیا', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

function _escW(s) {
  return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
