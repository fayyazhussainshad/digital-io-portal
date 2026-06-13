/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — RECYCLE BIN  (bin.js)
   Soft delete · 30-day retention · Restore · Permanent delete
   ═══════════════════════════════════════════════════════════ */

registerPage('bin', renderBin);

async function renderBin(container) {
  container.innerHTML = `<div id="bin-root" style="max-width:800px;margin:0 auto;">
    <div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ Loading...</div>
  </div>`;
  await _buildBin();
}

async function _buildBin() {
  const root = document.getElementById('bin-root');
  if (!root) return;

  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient
      .from('recycle_bin')
      .select('*')
      .eq('officer_id', oid)
      .order('deleted_at', { ascending: false });

    const items = data || [];
    const now   = new Date();

    // Group by type
    const groups = {};
    items.forEach(i => {
      if (!groups[i.item_type]) groups[i.item_type] = [];
      groups[i.item_type].push(i);
    });

    const typeLabels = {
      case:     { icon:'📁', label:'مقدمات' },
      patrol:   { icon:'🚔', label:'پیٹرول لاگ' },
      reminder: { icon:'🔔', label:'یاددہانیاں' },
      evidence: { icon:'📷', label:'شہادتیں' },
      court:    { icon:'⚖️', label:'عدالتی پیشیاں' },
      incident: { icon:'🚨', label:'Incident Reports' },
      other:    { icon:'📋', label:'دیگر' },
    };

    root.innerHTML = `
    <!-- Back -->
    <div style="margin-bottom:12px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">← واپس</button></div>
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;direction:rtl;">
      <div>
        <div style="font-size:18px;font-weight:800;">🗑️ Recycle Bin</div>
        <div style="font-size:12px;color:var(--text-muted);">حذف شدہ اشیاء · 30 دن بعد خودبخود ختم</div>
      </div>
      <div style="display:flex;gap:8px;direction:rtl;">
        <button class="btn btn-secondary" onclick="_binRestoreAll()">🔄 سب بحال کریں</button>
        <button class="btn btn-danger" onclick="_binEmptyAll()">🗑️ بن خالی کریں</button>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
      <div style="background:var(--bg-card);border-radius:10px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-size:22px;font-weight:800;color:var(--accent);">${items.length}</div>
        <div style="font-size:11px;color:var(--text-muted);">کل حذف شدہ</div>
      </div>
      <div style="background:var(--bg-card);border-radius:10px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-size:22px;font-weight:800;color:var(--amber);">
          ${items.filter(i=>{ const d=new Date(i.expires_at); return (d-now)/(1000*60*60*24) <= 7; }).length}
        </div>
        <div style="font-size:11px;color:var(--text-muted);">7 دن میں ختم</div>
      </div>
      <div style="background:var(--bg-card);border-radius:10px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-size:22px;font-weight:800;color:var(--green);">
          ${Object.keys(groups).length}
        </div>
        <div style="font-size:11px;color:var(--text-muted);">اقسام</div>
      </div>
    </div>

    ${items.length === 0 ? `
    <div style="text-align:center;padding:60px;color:var(--text-muted);">
      <div style="font-size:64px;margin-bottom:12px;">🗑️</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:6px;">بن خالی ہے</div>
      <div style="font-size:12px;">حذف کی گئی اشیاء یہاں دکھائی دیں گی</div>
    </div>` : Object.entries(groups).map(([type, groupItems]) => {
      const cfg = typeLabels[type] || typeLabels.other;
      return `
      <div class="card" style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">
          ${cfg.icon} ${cfg.label} (${groupItems.length})
        </div>
        ${groupItems.map(item => {
          const daysLeft = Math.ceil((new Date(item.expires_at) - now) / (1000*60*60*24));
          const urgent   = daysLeft <= 7;
          const d        = item.item_data || {};
          return `
          <div style="display:flex;gap:10px;direction:rtl;padding:9px 0;border-bottom:1px solid var(--border);align-items:flex-start;">
            <span style="font-size:22px;">${cfg.icon}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">
                ${_binTitle(type, d)}
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                ${_binDetail(type, d)}
              </div>
              <div style="font-size:10px;color:${urgent?'var(--red)':'var(--text-faint)'};margin-top:3px;">
                🕐 حذف: ${formatDate(item.deleted_at)} &nbsp;·&nbsp;
                ${urgent ? `⚠️ صرف ${daysLeft} دن باقی` : `${daysLeft} دن باقی`}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;">
              <button class="btn btn-primary btn-sm" onclick="_binRestore('${item.id}','${type}')">🔄 بحال</button>
              <button class="btn btn-danger btn-sm" onclick="_binDeletePerm('${item.id}')">✕ ہمیشہ کے لیے</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}`;

  } catch(e) {
    document.getElementById('bin-root').innerHTML =
      `<div style="text-align:center;padding:40px;color:var(--red);">❌ ${e.message}</div>`;
  }
}

// ── HELPERS ───────────────────────────────────────────────────
function _binTitle(type, d) {
  switch(type) {
    case 'case':     return `FIR ${d.fir_number||'—'} — ${d.complainant||'—'}`;
    case 'patrol':   return `${d.log_type||'Patrol'} — ${d.notes||'—'}`;
    case 'reminder': return d.text || '—';
    case 'evidence': return d.name || '—';
    case 'court':    return `FIR ${d.fir_number||'—'} — ${d.court_name||'—'}`;
    case 'incident': return `${d.report_number||'—'} — ${d.incident_type||'—'}`;
    default:         return d.title || d.name || d.text || '—';
  }
}

function _binDetail(type, d) {
  switch(type) {
    case 'case':     return `${d.section_of_law||'—'} · ${formatDate(d.fir_date)}`;
    case 'patrol':   return `${d.address||'—'} · ${formatDate(d.logged_at)}`;
    case 'reminder': return formatDate(d.reminder_date);
    case 'evidence': return `${d.type||'—'} · ${formatDate(d.created_at)}`;
    case 'court':    return `${d.hearing_date||'—'} · ${d.purpose||'—'}`;
    case 'incident': return `${d.incident_date||'—'} · ${d.address||'—'}`;
    default:         return formatDate(d.created_at||d.deleted_at);
  }
}

// ── RESTORE ───────────────────────────────────────────────────
async function _binRestore(binId, type) {
  try {
    const oid = await getOfficerId();
    const { data: binItem } = await supabaseClient
      .from('recycle_bin').select('*').eq('id', binId).single();
    if (!binItem) { showToast('⚠️ آئٹم نہیں ملا','error'); return; }

    const d = binItem.item_data;
    // Restore to original table
    const tableMap = {
      case:     'cases',
      patrol:   'patrol_logs',
      reminder: 'reminders',
      evidence: 'evidence',
      court:    'court_dates',
      incident: 'incident_reports',
    };
    const table = tableMap[type];
    if (table) {
      // Remove bin-specific fields before restoring
      const { id: _id, ...restoreData } = d;
      await supabaseClient.from(table).insert({ ...restoreData, officer_id: oid });
    }
    // Remove from bin
    await supabaseClient.from('recycle_bin').delete().eq('id', binId);
    showToast('✅ آئٹم بحال ہو گیا!', 'success');
    _buildBin();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── RESTORE ALL ───────────────────────────────────────────────
async function _binRestoreAll() {
  openModal('🔄 سب بحال کریں',
    `<p style="color:var(--text-secondary);font-size:13px;">کیا آپ بن کی تمام اشیاء بحال کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="closeModal();_binDoRestoreAll()">🔄 ہاں، سب بحال کریں</button>`
  );
}

async function _binDoRestoreAll() {
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient.from('recycle_bin').select('*').eq('officer_id', oid);
    for (const item of (data||[])) {
      await _binRestore(item.id, item.item_type);
    }
    showToast('✅ تمام آئٹم بحال ہو گئے!', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PERMANENT DELETE ──────────────────────────────────────────
async function _binDeletePerm(binId) {
  openModal('⚠️ مستقل حذف',
    `<p style="color:var(--red);font-size:13px;">یہ آئٹم ہمیشہ کے لیے حذف ہو جائے گا — واپس نہیں آ سکتا!</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_binDoPerm('${binId}')">✕ مستقل حذف</button>`
  );
}

async function _binDoPerm(binId) {
  await supabaseClient.from('recycle_bin').delete().eq('id', binId);
  showToast('🗑️ مستقل حذف ہو گیا', 'info');
  _buildBin();
}

// ── EMPTY ALL ─────────────────────────────────────────────────
function _binEmptyAll() {
  openModal('🗑️ بن خالی کریں',
    `<p style="color:var(--red);font-size:13px;">تمام اشیاء ہمیشہ کے لیے حذف ہو جائیں گی — واپس نہیں آ سکتیں!</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_binDoEmpty()">🗑️ ہاں، بن خالی کریں</button>`
  );
}

async function _binDoEmpty() {
  const oid = await getOfficerId();
  await supabaseClient.from('recycle_bin').delete().eq('officer_id', oid);
  showToast('🗑️ بن خالی ہو گئی', 'info');
  _buildBin();
}

// ── SOFT DELETE HELPER (call this instead of direct delete) ───
// Usage: await softDelete('case', caseId, caseData)
async function softDelete(type, itemId, itemData) {
  try {
    const oid = await getOfficerId();
    await supabaseClient.from('recycle_bin').insert({
      officer_id: oid,
      item_type:  type,
      item_id:    itemId,
      item_data:  itemData,
    });
    return true;
  } catch(_) { return false; }
}
