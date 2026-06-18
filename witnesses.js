/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — WITNESSES / PERSONS (per case, universal)
   Compact horizontal strip cards + cross-reference
   ═══════════════════════════════════════════════════════════ */

// Default witness status options (officer can add custom via +)
const WITNESS_STATUS = [
  { v:'fir_eye',  label:'FIR چشم دید' },
  { v:'tatima',   label:'تتمہ بیان' },
  { v:'fard',     label:'فرد' },
  { v:'mazroob',  label:'مزروب' },
  { v:'victim',   label:'Victim' },
  { v:'maghvi',   label:'مغوی' },
];

let _witnessList = [];
let _witnessCaseId = null;
let _editingWitnessId = null;

async function openWitnessesCard(caseId) {
  _witnessCaseId = caseId || _misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  await _loadWitnesses();
  _renderWitnessesArea();
}

async function _loadWitnesses() {
  try {
    const { data } = await supabaseClient
      .from('case_witnesses').select('*')
      .eq('case_id', _witnessCaseId)
      .order('created_at', { ascending: true });
    _witnessList = data || [];
  } catch(_) { _witnessList = []; }
}

function _renderWitnessesArea() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  area.innerHTML = `
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
      <div style="font-size:17px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;">👁️ گواہان</div>
      <button class="btn btn-primary btn-sm" onclick="_openWitnessForm()">➕ نیا گواہ</button>
    </div>
    <div id="witness-form-box"></div>
    <div id="witness-list-box" style="margin-top:12px;">${_renderWitnessList()}</div>
  </div>`;
}

// Compact single-row strips
function _renderWitnessList() {
  if (!_witnessList.length) {
    return `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">ابھی کوئی گواہ شامل نہیں</div>`;
  }
  return _witnessList.map((w, i) => {
    const statusLabel = (WITNESS_STATUS.find(s => s.v === w.status) || {}).label || w.status || '—';
    return `
    <div style="display:flex;align-items:center;gap:10px;background:var(--bg-card);border:1px solid var(--border);border-right:3px solid var(--accent);border-radius:8px;padding:8px 12px;margin-bottom:7px;direction:rtl;font-size:12px;flex-wrap:nowrap;overflow-x:auto;">
      <span style="font-weight:800;color:var(--accent);white-space:nowrap;">گواہ ${i+1}</span>
      <span style="font-weight:700;white-space:nowrap;font-family:'Jameel Noori Nastaleeq',serif;">${w.full_name||'—'}</span>
      ${w.cnic?`<span style="color:var(--text-muted);direction:ltr;white-space:nowrap;">${w.cnic}</span>`:''}
      ${w.cell?`<span style="color:var(--text-muted);direction:ltr;white-space:nowrap;">${w.cell}</span>`:''}
      ${w.profession?`<span style="color:var(--text-muted);white-space:nowrap;">${w.profession}</span>`:''}
      <span style="background:var(--accent-glow);color:var(--accent);border-radius:10px;padding:2px 8px;white-space:nowrap;font-size:11px;">${statusLabel}</span>
      <span style="flex:1;"></span>
      <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="_openWitnessForm('${w.id}')">✏️</button>
      <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="_deleteWitness('${w.id}')">🗑️</button>
    </div>`;
  }).join('');
}

function _openWitnessForm(id) {
  _editingWitnessId = id || null;
  const w = id ? (_witnessList.find(x => x.id === id) || {}) : {};
  const box = document.getElementById('witness-form-box');
  if (!box) return;
  box.innerHTML = `
  <div class="card" style="padding:14px;border:1px solid var(--accent);">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">${id?'✏️ گواہ کی ترمیم':'➕ نیا گواہ'}</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div style="grid-column:1/-1;">
        <label class="form-label">نام *</label>
        <input class="form-input" id="w-name" value="${_escW(w.full_name)}" placeholder="پورا نام" oninput="_checkPriorRecord(this.value)">
        <div id="w-prior-record" style="margin-top:6px;"></div>
      </div>
      <div>
        <label class="form-label">شناختی کارڈ</label>
        <input class="form-input" id="w-cnic" dir="ltr" value="${_escW(w.cnic)}" placeholder="00000-0000000-0" oninput="_checkPriorByContact()">
      </div>
      <div>
        <label class="form-label">فون نمبر</label>
        <input class="form-input" id="w-cell" dir="ltr" value="${_escW(w.cell)}" placeholder="0000-0000000" oninput="_checkPriorByContact()">
      </div>
      <div>
        <label class="form-label">پیشہ</label>
        <input class="form-input" id="w-profession" value="${_escW(w.profession)}" placeholder="پیشہ">
      </div>
      <div>
        <label class="form-label">حیثیت (Status)</label>
        <div style="display:flex;gap:5px;">
          <select class="form-input" id="w-status" style="flex:1;">
            ${WITNESS_STATUS.map(s => `<option value="${s.v}" ${w.status===s.v?'selected':''}>${s.label}</option>`).join('')}
            ${w.status && !WITNESS_STATUS.find(s=>s.v===w.status) ? `<option value="${w.status}" selected>${w.status}</option>` : ''}
          </select>
          <button class="btn btn-secondary btn-sm" onclick="_addCustomStatus()" title="نیا اسٹیٹس">➕</button>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn btn-primary" onclick="_saveWitness()">💾 محفوظ کریں</button>
      <button class="btn btn-secondary" onclick="document.getElementById('witness-form-box').innerHTML=''">منسوخ</button>
    </div>
  </div>`;
  box.scrollIntoView({ behavior:'smooth', block:'start' });
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
        <span>${icon} <b>${p.full_name}</b> — ${role}</span>
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
  };
  if (!rec.full_name) { showToast('⚠️ نام ضروری ہے','error'); return; }
  try {
    const oid = await getOfficerId();
    if (_editingWitnessId) {
      await supabaseClient.from('case_witnesses').update(rec).eq('id', _editingWitnessId);
    } else {
      await supabaseClient.from('case_witnesses').insert({ ...rec, officer_id: oid });
      try {
        await supabaseClient.from('suspects').insert({
          officer_id: oid, person_type:'witness',
          full_name: rec.full_name, profession: rec.profession,
          cnic: rec.cnic, cell: rec.cell,
        });
      } catch(_) {}
    }
    document.getElementById('witness-form-box').innerHTML = '';
    await _loadWitnesses();
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
