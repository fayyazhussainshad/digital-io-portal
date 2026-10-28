/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — Global SHO / DSP-SDPO name management
   Stored in localStorage, used across all reports
   ═══════════════════════════════════════════════════════════ */

// SHO ke liye SIRF do عہدے; DSP/SDPO ke liye apni fehrist
const SHO_RANKS = ['SI/SHO', 'I/SHO'];
const DSP_RANKS = ['DSP','SDPO','SP','SSP'];
   // backward compatible

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
  try { cur = JSON.parse(localStorage.getItem(key) || '{}'); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }

  openModal(title, `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:60px;">رینک:</label>
        <select id="shodsp-rank" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;">
          ${(isSho ? SHO_RANKS : DSP_RANKS).map(r => `<option value="${r}" ${cur.rank===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:60px;">نام:</label>
        <input id="shodsp-name" type="text" value="${esc(cur.name||'')}" placeholder="نام لکھیں"
          style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveShoDsp('${type}')">محفوظ کریں</button>
  `);
}
window.openShoDspModal = openShoDspModal;

function _saveShoDsp(type) {
  // v561: میعاد ختم = صرف دیکھنا — ترتیب بھی نہیں بدلتی
  if (window.DIO && DIO.sub && typeof DIO.sub.guard === 'function' && !DIO.sub.guard('ترتیب محفوظ')) return;
  const isSho = type === 'sho';
  const key = isSho ? 'digital_io_sho' : 'digital_io_dsp';
  const rank = (document.getElementById('shodsp-rank')||{}).value || '';
  const name = (document.getElementById('shodsp-name')||{}).value || '';
  try { localStorage.setItem(key, JSON.stringify({ rank, name })); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  // v561: سب آلات پر ایک ہی SHO / DSP-SDPO (موبائل پر بدلا تو لیپ ٹاپ پر بھی)
  try { if (window.DIOSync && typeof DIOSync.settingChanged === 'function') DIOSync.settingChanged(key); } catch(_) { /* اگلی بار */ }
  closeModal();
  _updateShoDspButtons();
  if (typeof showToast === 'function') showToast(''+(isSho?'SHO':'DSP/SDPO')+' کا نام محفوظ', 'success');
}
window._saveShoDsp = _saveShoDsp;

// Update topbar button labels with saved names
function _updateShoDspButtons() {
  // Buttons always show fixed labels; names stored in localStorage, used in reports only
  const shoBtn = document.getElementById('topbar-sho-btn');
  const dspBtn = document.getElementById('topbar-dsp-btn');
  if (shoBtn) shoBtn.innerHTML = 'SHO';
  if (dspBtn) dspBtn.innerHTML = 'DSP/SDPO';
}
window._updateShoDspButtons = _updateShoDspButtons;

// Init labels on load
document.addEventListener('DOMContentLoaded', () => { setTimeout(_updateShoDspButtons, 300); });

/* ── سرکاری گاڑی (Official Vehicle) ──────────────────────────── */
function getSarkariGari() {
  try { return JSON.parse(localStorage.getItem('digital_io_sarkari_gari') || '{}'); }
  catch(_) { return {}; }
}
window.getSarkariGari = getSarkariGari;

function openSarkariGari() {
  const cur = getSarkariGari();
  openModal('سرکاری گاڑی', `
    <div style="direction:rtl;display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:90px;">گاڑی نمبر:</label>
        <input id="gari-number" type="text" dir="ltr" value="${esc(cur.vehicle_number||'')}" placeholder="ABC-123"
          style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;direction:ltr;text-align:left;">
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <label style="min-width:90px;">ڈرائیور کا نام:</label>
        <input id="gari-driver" type="text" value="${esc(cur.driver_name||'')}" placeholder="نام لکھیں"
          style="flex:1;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;">
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
    <button class="btn btn-primary" onclick="_saveSarkariGari()">محفوظ کریں</button>
  `);
}
window.openSarkariGari = openSarkariGari;

async function _saveSarkariGari() {
  const vehicle_number = (document.getElementById('gari-number')||{}).value || '';
  const driver_name = (document.getElementById('gari-driver')||{}).value || '';
  // v546: پہلے ہر بار نئی قطار insert ہوتی (دوہرے اندراج) اور نتیجہ دیکھے بغیر
  //   «محفوظ» دکھایا جاتا۔ اب ہر مقدمے کی ایک قطار: پہلی بار insert، پھر update۔
  const cur = getSarkariGari();
  const ids = (cur && typeof cur.ids === 'object' && cur.ids) ? cur.ids : {};
  const cid = (typeof _misalCaseId !== 'undefined' && _misalCaseId) ? String(_misalCaseId) : '_';
  const keep = () => {
    try { localStorage.setItem('digital_io_sarkari_gari', JSON.stringify({ vehicle_number, driver_name, ids })); }
    catch (_) { if (typeof dioLogError === 'function') dioLogError('sarkari gari: local save nakaam', _); }
  };
  keep();   // اس آلے پر پہلے (کبھی ضائع نہ ہو)
  let oid = null;
  try { oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; } catch (_) { /* افسر کی شناخت نہ ملے تو RLS خود فیصلہ کرے گا */ }
  const rec = { vehicle_number, driver_name };
  if (oid) rec.officer_id = oid;
  if (cid !== '_') rec.case_id = cid;
  // v547: انٹرنیٹ کے بغیر دو بار «محفوظ» پر قطار میں دو insert بنتے تھے — اب اسی
  //   مقدمے کا زیرِ التوا اندراج بدل جاتا ہے (queueKey)۔ اور جو اندراج آف لائن سے
  //   سرور پر پہنچا اس کا id اس آلے کو معلوم نہیں ہوتا — اس لیے id نہ ہو تو پہلے سرور
  //   پر اسی مقدمے کی قطار ڈھونڈو، ملے تو وہی بدلو (نئی قطار نہیں)۔
  const qk = { queueKey: 'sarkari_gari:' + cid };
  if (!ids[cid] && oid && navigator.onLine !== false && typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      let q = supabaseClient.from('sarkari_gari').select('id').eq('officer_id', oid);
      q = (cid !== '_') ? q.eq('case_id', cid) : q.is('case_id', null);
      const { data: found, error: fErr } = await q.limit(1);
      if (!fErr && found && found[0] && found[0].id) ids[cid] = found[0].id;
    } catch (_) { if (typeof dioLogError === 'function') dioLogError('sarkari gari: purani qataar talash nakaam', _); }
  }
  let res = null;
  if (ids[cid]) res = await dioSaveRow('sarkari_gari', 'update', { id: ids[cid], ...rec }, qk);
  if (!res || res.status === 'missing') res = await dioSaveRow('sarkari_gari', 'insert', rec, qk);
  if (res.status === 'ok' && res.data && res.data.id) { ids[cid] = res.data.id; keep(); }
  closeModal();
  dioSaveToast(res, 'سرکاری گاڑی', { ok: 'محفوظ ہو گئی', fail: 'محفوظ نہیں ہوئی' });
}
window._saveSarkariGari = _saveSarkariGari;

// ═══════════════════════════════════════════════════════════════
//  MARKAZI HELPER — SHO ki dastakhati line (poore system mein yaksan)
//  Tarteeb: NAAM → RANK (SI/SHO ya I/SHO) → تھانہ
//  Misal: "محبوب احمد SI/SHO تھانہ صدر ملتان"
// ═══════════════════════════════════════════════════════════════
function getSHOSignLine(station) {
  let name = '', rank = '';
  try {
    const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
    name = (sho.name || '').trim();
    rank = (sho.rank || '').trim();
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  const st = (station || (typeof currentOfficer !== 'undefined' && currentOfficer ? currentOfficer.station : '') || '').trim();
  const parts = [];
  if (name) parts.push(name);
  if (rank) parts.push(rank);
  let line = parts.join(' ');
  if (st) line += (line ? ' ' : '') + 'تھانہ ' + st;
  return line;
}
window.getSHOSignLine = getSHOSignLine;
