/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SUSPECT / WITNESS DATABASE
   Cross-reference people across cases
   ═══════════════════════════════════════════════════════════ */

registerPage('suspects', renderSuspects);

const SUSPECT_TYPES = {
  suspect:    { label: 'ملزم',   icon: '🚨', color: 'var(--red)' },
  witness:    { label: 'گواہ',   icon: '👁️', color: 'var(--accent)' },
  complainant:{ label: 'مدعی',   icon: '📢', color: 'var(--green)' },
  accused:    { label: 'مجرم',   icon: '⛓️', color: '#a78bfa' },
};

async function renderSuspects(container) {
  container.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">⏳ لوڈ ہو رہا ہے...</div>`;

  const people = await _getSuspects();

  container.innerHTML = `
  <div style="direction:rtl;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <div>
        <div style="font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;">👤 ملزمان / گواہان ڈیٹابیس</div>
        <div style="font-size:12px;color:var(--text-muted);">تمام افراد ایک جگہ — مقدمات کے ساتھ منسلک</div>
      </div>
      <button class="btn btn-primary" onclick="_openSuspectForm()">➕ نیا اندراج</button>
    </div>

    <!-- Search -->
    <div style="margin-bottom:14px;">
      <input class="form-input" id="suspect-search" placeholder="🔍 نام، شناختی کارڈ، یا فون سے تلاش کریں..."
        oninput="_filterSuspects(this.value)" style="width:100%;">
    </div>

    <!-- Type filter -->
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm suspect-filter active" data-type="" onclick="_filterByType('',this)">سب</button>
      ${Object.entries(SUSPECT_TYPES).map(([k,v])=>`
        <button class="btn btn-secondary btn-sm suspect-filter" data-type="${k}" onclick="_filterByType('${k}',this)">${v.icon} ${v.label}</button>`).join('')}
    </div>

    <!-- List -->
    <div id="suspects-list">
      ${_renderSuspectList(people)}
    </div>
  </div>`;

  window._suspectsCache = people;
}

function _renderSuspectList(people) {
  if (!people.length) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:48px;margin-bottom:12px;">👤</div>
      <div style="font-size:14px;">کوئی اندراج نہیں</div>
    </div>`;
  }

  return `<div style="display:flex;flex-direction:column;gap:10px;">
    ${people.map(p => {
      const t = SUSPECT_TYPES[p.person_type] || SUSPECT_TYPES.suspect;
      const caseCount = (p.linked_cases || []).length;
      return `
      <div class="card" style="padding:14px;cursor:pointer;border-right:3px solid ${t.color};" onclick="_viewSuspect('${p.id}')">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:50%;background:${t.color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${t.icon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">${p.full_name || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">
              ${t.label}${p.cnic ? ` · <span dir="ltr">${p.cnic}</span>` : ''}${p.cell ? ` · <span dir="ltr">${p.cell}</span>` : ''}
            </div>
          </div>
          ${caseCount ? `<div style="background:var(--accent-glow);color:var(--accent);border-radius:12px;padding:3px 10px;font-size:11px;font-weight:700;white-space:nowrap;">${caseCount} مقدمات</div>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── DATA ──────────────────────────────────────────────────────
async function _getSuspects() {
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient.from('suspects')
      .select('*').eq('officer_id', oid).order('created_at', { ascending: false });
    return data || [];
  } catch(_) { return []; }
}

// ── SEARCH / FILTER ───────────────────────────────────────────
function _filterSuspects(q) {
  const people = window._suspectsCache || [];
  q = (q || '').toLowerCase().trim();
  const filtered = !q ? people : people.filter(p =>
    (p.full_name || '').toLowerCase().includes(q) ||
    (p.cnic || '').includes(q) ||
    (p.cell || '').includes(q)
  );
  const list = document.getElementById('suspects-list');
  if (list) list.innerHTML = _renderSuspectList(filtered);
}

function _filterByType(type, el) {
  document.querySelectorAll('.suspect-filter').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  const people = window._suspectsCache || [];
  const filtered = !type ? people : people.filter(p => p.person_type === type);
  const list = document.getElementById('suspects-list');
  if (list) list.innerHTML = _renderSuspectList(filtered);
}

// ── ADD / EDIT FORM ───────────────────────────────────────────
function _openSuspectForm(existing) {
  const p = existing || {};
  const isEdit = !!existing;
  openModal(isEdit ? '✏️ ترمیم' : '➕ نیا اندراج', `
    <div style="display:flex;flex-direction:column;gap:12px;direction:rtl;">
      <div>
        <label class="form-label">قسم *</label>
        <select class="form-input" id="sp-type">
          ${Object.entries(SUSPECT_TYPES).map(([k,v])=>`<option value="${k}" ${p.person_type===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="form-label">پورا نام *</label>
        <input class="form-input" id="sp-name" value="${_escSp(p.full_name)}" placeholder="نام">
      </div>
      <div>
        <label class="form-label">ولدیت</label>
        <input class="form-input" id="sp-father" value="${_escSp(p.father_name)}" placeholder="ولدیت">
      </div>
      <div>
        <label class="form-label">ذات / قوم</label>
        <input class="form-input" id="sp-caste" value="${_escSp(p.caste)}" placeholder="ذات">
      </div>
      <div>
        <label class="form-label">پیشہ / کاروبار</label>
        <input class="form-input" id="sp-profession" value="${_escSp(p.profession)}" placeholder="پیشہ">
      </div>
      <div>
        <label class="form-label">شناختی کارڈ نمبر</label>
        <input class="form-input" id="sp-cnic" dir="ltr" value="${_escSp(p.cnic)}" placeholder="XXXXX-XXXXXXX-X">
      </div>
      <div>
        <label class="form-label">فون نمبر</label>
        <input class="form-input" id="sp-cell" dir="ltr" value="${_escSp(p.cell)}" placeholder="0XXX-XXXXXXX">
      </div>
      <div>
        <label class="form-label">پتہ</label>
        <textarea class="form-input" id="sp-address" style="min-height:50px;">${_escSp(p.address)}</textarea>
      </div>
      <div>
        <label class="form-label">تفصیل / نوٹس</label>
        <textarea class="form-input" id="sp-notes" style="min-height:60px;">${_escSp(p.notes)}</textarea>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveSuspect(${isEdit ? `'${p.id}'` : 'null'})">💾 محفوظ کریں</button>
  `);
}

async function _saveSuspect(id) {
  const rec = {
    person_type: document.getElementById('sp-type').value,
    full_name:   document.getElementById('sp-name').value.trim() || null,
    father_name: document.getElementById('sp-father').value.trim() || null,
    caste:       document.getElementById('sp-caste').value.trim() || null,
    profession:  document.getElementById('sp-profession').value.trim() || null,
    cnic:        document.getElementById('sp-cnic').value.trim() || null,
    cell:        document.getElementById('sp-cell').value.trim() || null,
    address:     document.getElementById('sp-address').value.trim() || null,
    notes:       document.getElementById('sp-notes').value.trim() || null,
  };
  if (!rec.full_name) { showToast('⚠️ نام ضروری ہے', 'error'); return; }

  try {
    const oid = await getOfficerId();
    if (id) {
      await supabaseClient.from('suspects').update(rec).eq('id', id);
    } else {
      await supabaseClient.from('suspects').insert({ ...rec, officer_id: oid });
    }
    closeModal();
    showToast('✅ محفوظ ہو گیا', 'success');
    showPage('suspects', document.querySelector('.nav-item.active'));
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── VIEW DETAIL + CROSS-REFERENCE ─────────────────────────────
async function _viewSuspect(id) {
  const p = (window._suspectsCache || []).find(x => x.id === id);
  if (!p) return;
  const t = SUSPECT_TYPES[p.person_type] || SUSPECT_TYPES.suspect;

  // Cross-reference: find cases mentioning this person (by name or CNIC)
  const matchedCases = await _findCasesForPerson(p);

  openModal(`${t.icon} ${p.full_name}`, `
    <div style="direction:rtl;">
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;font-size:13px;">
        <div><b>قسم:</b> ${t.label}</div>
        ${p.father_name ? `<div><b>ولدیت:</b> ${p.father_name}</div>` : ''}
        ${p.caste ? `<div><b>ذات:</b> ${p.caste}</div>` : ''}
        ${p.profession ? `<div><b>پیشہ:</b> ${p.profession}</div>` : ''}
        ${p.cnic ? `<div><b>شناختی کارڈ:</b> <span dir="ltr">${p.cnic}</span></div>` : ''}
        ${p.cell ? `<div><b>فون:</b> <span dir="ltr">${p.cell}</span></div>` : ''}
        ${p.address ? `<div><b>پتہ:</b> ${p.address}</div>` : ''}
        ${p.notes ? `<div><b>نوٹس:</b> ${p.notes}</div>` : ''}
      </div>

      <!-- Cross-referenced cases -->
      <div style="border-top:1px solid var(--border);padding-top:12px;">
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;">🔗 متعلقہ مقدمات (${matchedCases.length})</div>
        ${matchedCases.length ? matchedCases.map(c => `
          <div style="background:var(--bg-secondary);border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer;" onclick="closeModal();openCaseWorkspace('${c.id}')">
            <div style="font-size:13px;font-weight:700;color:var(--accent);">FIR ${c.fir_number || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${c.section_of_law || '—'} · ${STATUS_LABELS[c.status] || c.status || ''}</div>
          </div>
        `).join('') : '<div style="font-size:12px;color:var(--text-muted);">کوئی متعلقہ مقدمہ نہیں ملا</div>'}
      </div>
    </div>
  `, `
    <button class="btn btn-danger btn-sm" onclick="_deleteSuspect('${p.id}')">🗑️ حذف</button>
    <button class="btn btn-secondary" onclick="_openSuspectForm(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️ ترمیم</button>
    <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
  `);
}

// Cross-reference engine: match person to cases by name or CNIC
async function _findCasesForPerson(p) {
  try {
    const allCases = await getCases();
    const name = (p.full_name || '').toLowerCase();
    const cnic = (p.cnic || '').replace(/\D/g, '');
    return allCases.filter(c => {
      const fields = [
        c.complainant, c.complainant_cnic, c.accused_name,
        c.mulzman_name, c.witness_name, c.notes
      ].filter(Boolean).join(' ').toLowerCase();
      const fieldsDigits = fields.replace(/\D/g, '');
      return (name && fields.includes(name)) || (cnic && cnic.length >= 10 && fieldsDigits.includes(cnic));
    });
  } catch(_) { return []; }
}

async function _deleteSuspect(id) {
  if (!confirm('کیا آپ واقعی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('suspects').delete().eq('id', id);
    closeModal();
    showToast('✅ حذف ہو گیا', 'success');
    showPage('suspects', document.querySelector('.nav-item.active'));
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

function _escSp(s) {
  return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
