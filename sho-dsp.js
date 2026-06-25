/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — Global SHO / DSP-SDPO name management
   Stored in localStorage, used across all reports
   ═══════════════════════════════════════════════════════════ */

const SHO_DSP_RANKS = ['ASI','SI','Inspector','DSP','SDPO','SP','SSP'];

// Helper: get SHO rank+name
function getSHOName() {
  try {
    const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
    return [sho.rank||'', sho.name||''].filter(Boolean).join(' ');
  } catch(_) { return ''; }
}
// Helper: get DSP/SDPO rank+name
function getDSPName() {
  try {
    const dsp = JSON.parse(localStorage.getItem('digital_io_dsp') || '{}');
    return [dsp.rank||'', dsp.name||''].filter(Boolean).join(' ');
  } catch(_) { return ''; }
}
window.getSHOName = getSHOName;
window.getDSPName = getDSPName;

// Open SHO/DSP name modal
function openShoDspModal(type) {
  const isSho = type === 'sho';
  const key = isSho ? 'digital_io_sho' : 'digital_io_dsp';
  const title = isSho ? 'SHO کا نام درج کریں' : 'DSP/SDPO کا نام درج کریں';
  let cur = {};
  try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch(_) {}

  openModal(title, `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:60px;">رینک:</label>
        <select id="shodsp-rank" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;">
          ${SHO_DSP_RANKS.map(r => `<option value="${r}" ${cur.rank===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:60px;">نام:</label>
        <input id="shodsp-name" type="text" value="${cur.name||''}" placeholder="نام لکھیں"
          style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveShoDsp('${type}')">💾 محفوظ کریں</button>
  `);
}
window.openShoDspModal = openShoDspModal;

function _saveShoDsp(type) {
  const isSho = type === 'sho';
  const key = isSho ? 'digital_io_sho' : 'digital_io_dsp';
  const rank = (document.getElementById('shodsp-rank')||{}).value || '';
  const name = (document.getElementById('shodsp-name')||{}).value || '';
  try { localStorage.setItem(key, JSON.stringify({ rank, name })); } catch(_) {}
  closeModal();
  _updateShoDspButtons();
  if (typeof showToast === 'function') showToast('✅ '+(isSho?'SHO':'DSP/SDPO')+' کا نام محفوظ', 'success');
}
window._saveShoDsp = _saveShoDsp;

// Update topbar button labels with saved names
function _updateShoDspButtons() {
  const shoBtn = document.getElementById('topbar-sho-btn');
  const dspBtn = document.getElementById('topbar-dsp-btn');
  if (shoBtn) {
    const s = getSHOName();
    shoBtn.innerHTML = s ? `SHO: ${s}` : 'SHO';
  }
  if (dspBtn) {
    const d = getDSPName();
    dspBtn.innerHTML = d ? `DSP/SDPO: ${d}` : 'DSP/SDPO';
  }
}
window._updateShoDspButtons = _updateShoDspButtons;

// Init labels on load
document.addEventListener('DOMContentLoaded', () => { setTimeout(_updateShoDspButtons, 300); });
