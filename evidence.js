// ═══════════════════════════════════════════════════
//  DIGITAL IO — EVIDENCE PAGE
// ═══════════════════════════════════════════════════
registerPage('evidence', renderEvidence);

async function renderEvidence(container) {
  const all = await getEvidence();

  container.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">🔬 Evidence & Media</div>
        <div class="page-subtitle">${all.length} items attached</div>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary btn-sm" onclick="selectAllEvidence()">☑️ Select All</button>
        <button class="btn btn-secondary btn-sm" onclick="deselectAllEvidence()">☐ Deselect</button>
        <button class="btn btn-secondary btn-sm" onclick="printSelectedEvidence()">🖨️ Print Selected</button>
        <button class="btn btn-primary" onclick="openAddEvidenceModal()">+ Attach Evidence</button>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;">
      <select class="filter-select" id="ev-fir-filter" onchange="filterEvidenceDisplay()">
        <option value="">FIR: All</option>
        ${[...new Set(all.map(e=>e.fir_number).filter(Boolean))].map(f=>`<option value="${f}">${f}</option>`).join('')}
      </select>
      <select class="filter-select" id="ev-type-filter" onchange="filterEvidenceDisplay()">
        <option value="">Type: All</option>
        <option>Photo</option><option>Video</option><option>Audio</option><option>Document</option>
      </select>
      <span id="ev-selected-count" style="font-size:11px;color:var(--text-muted);"></span>
    </div>

    <div class="evidence-grid" id="evidence-grid">
      ${renderEvidenceCards(all)}
    </div>

    <div style="margin-top:12px;padding:10px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;font-size:11px;color:var(--text-faint);">
      🔒 All original files stored in <b style="color:var(--accent);">read-only mode</b>. Tagged with Case No., FIR, Date/Time, Officer ID.
    </div>`;
}

function renderEvidenceCards(items) {
  if (!items.length) return `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px;font-size:12px;">No evidence attached yet. Click "+ Attach Evidence" to add.</div>`;
  const icons = { Photo:'📷', Video:'🎥', Audio:'🎙️', Document:'📄' };
  return items.map(e => `
    <div class="evidence-card" id="ev-card-${e.id}">
      <div class="evidence-thumb" style="position:relative;">
        ${e.file_url ? `<img src="${e.file_url}" style="width:100%;height:100%;object-fit:cover;" alt="">` : `<span style="font-size:36px;">${icons[e.type]||'📄'}</span>`}
        <input type="checkbox" class="ev-select-cb" data-id="${e.id}"
          style="position:absolute;top:8px;left:8px;width:16px;height:16px;accent-color:var(--accent);"
          onchange="updateEvidenceSelCount()">
      </div>
      <div class="evidence-info" onclick="viewEvidenceDetail('${e.id}')">
        <div class="evidence-name">${e.name}</div>
        <div class="evidence-tag">${e.fir_number||'—'}</div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span style="font-size:10px;background:var(--hover-bg);color:var(--text-muted);padding:2px 6px;border-radius:4px;">${e.type}</span>
          <span style="font-size:9px;color:var(--text-faint);">${e.evidence_date||formatDate(e.created_at)}</span>
        </div>
      </div>
    </div>`).join('');
}

let allEvidenceCache = [];
async function filterEvidenceDisplay() {
  let items = await getEvidence();
  const firF = document.getElementById('ev-fir-filter')?.value;
  const typeF = document.getElementById('ev-type-filter')?.value;
  if (firF) items = items.filter(e => e.fir_number === firF);
  if (typeF) items = items.filter(e => e.type === typeF);
  const grid = document.getElementById('evidence-grid');
  if (grid) grid.innerHTML = renderEvidenceCards(items);
}

function updateEvidenceSelCount() {
  const n = document.querySelectorAll('.ev-select-cb:checked').length;
  const el = document.getElementById('ev-selected-count');
  if (el) el.textContent = n > 0 ? `${n} selected` : '';
}
function selectAllEvidence() { document.querySelectorAll('.ev-select-cb').forEach(cb => cb.checked=true); updateEvidenceSelCount(); }
function deselectAllEvidence() { document.querySelectorAll('.ev-select-cb').forEach(cb => cb.checked=false); updateEvidenceSelCount(); }

function printSelectedEvidence() {
  const selected = [...document.querySelectorAll('.ev-select-cb:checked')].map(cb => cb.dataset.id);
  if (!selected.length) { showToast('⚠️ Select at least one item to print.', 'error'); return; }
  const cards = selected.map(id => document.getElementById('ev-card-' + id)?.outerHTML || '').join('');
  printContent(`<h1>🔬 Evidence Report</h1><div style="display:flex;flex-wrap:wrap;gap:12px;">${cards}</div>`,'Evidence Report — Digital IO');
}

let cameraStream = null;
function openAddEvidenceModal() {
  openModal('➕ Attach Evidence',
    `<div class="btn-group" style="margin-bottom:14px;">
       <button class="btn btn-secondary btn-sm" onclick="openCamera()">📸 Live Camera</button>
       <button class="btn btn-secondary btn-sm" onclick="openFileSelect()">📎 Select File</button>
     </div>
     <div id="camera-preview" style="display:none;margin-bottom:12px;">
       <video id="cam-video" style="width:100%;border-radius:8px;max-height:200px;" autoplay playsinline></video>
       <div class="btn-group" style="margin-top:8px;">
         <button class="btn btn-primary btn-sm" onclick="snapPhoto()">📸 Capture</button>
         <button class="btn btn-secondary btn-sm" onclick="stopCamera()">✕ Stop</button>
       </div>
       <canvas id="cam-canvas" style="display:none;"></canvas>
       <img id="cam-snap" style="display:none;width:100%;border-radius:8px;margin-top:8px;border:2px solid var(--accent);" alt="">
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="ev-name" placeholder="e.g. Crime scene photo"></div>
       <div class="form-group"><label class="form-label">Linked FIR *</label><input class="form-input" id="ev-fir-link" placeholder="e.g. 245/2025"></div>
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Type</label>
         <select class="form-input" id="ev-type-input">
           <option>Photo</option><option>Video</option><option>Audio</option><option>Document</option>
         </select>
       </div>
       <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="ev-date-input" placeholder="DD-MM-YYYY"></div>
     </div>
     <div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" id="ev-notes-input" rows="2" placeholder="Description..."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="stopCamera();closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveEvidenceItem()">💾 Attach</button>`
  );
}

function openCamera() {
  document.getElementById('camera-preview').style.display = 'block';
  navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { cameraStream = stream; document.getElementById('cam-video').srcObject = stream; })
    .catch(() => showToast('⚠️ Camera not available.', 'error'));
}
function stopCamera() {
  cameraStream?.getTracks().forEach(t => t.stop()); cameraStream = null;
}
function snapPhoto() {
  const video = document.getElementById('cam-video');
  const canvas = document.getElementById('cam-canvas');
  const snap = document.getElementById('cam-snap');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  snap.src = canvas.toDataURL('image/jpeg', 0.9);
  snap.style.display = 'block'; video.style.display = 'none'; stopCamera();
  const nameInp = document.getElementById('ev-name');
  if (nameInp && !nameInp.value) nameInp.value = 'Live Photo ' + new Date().toLocaleString('en-PK');
  document.getElementById('ev-type-input').value = 'Photo';
  showToast('✅ Photo captured!', 'success');
}
function openFileSelect() {
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*,video/*,audio/*,.pdf,.doc,.docx';
  inp.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const nameInp = document.getElementById('ev-name');
    if (nameInp && !nameInp.value) nameInp.value = file.name;
    const typeInp = document.getElementById('ev-type-input');
    if (typeInp) { if(file.type.startsWith('image'))typeInp.value='Photo'; else if(file.type.startsWith('video'))typeInp.value='Video'; else if(file.type.startsWith('audio'))typeInp.value='Audio'; else typeInp.value='Document'; }
    showToast('📎 File selected: ' + file.name, 'success');
  };
  inp.click();
}

async function saveEvidenceItem() {
  const name = document.getElementById('ev-name').value.trim();
  const fir = document.getElementById('ev-fir-link').value.trim();
  if (!name || !fir) { showToast('⚠️ Name and FIR are required.', 'error'); return; }
  try {
    await addEvidence({
      name, fir_number: fir,
      type: document.getElementById('ev-type-input').value,
      evidence_date: document.getElementById('ev-date-input').value,
      notes: document.getElementById('ev-notes-input').value,
      is_readonly: true,
    });
    stopCamera(); closeModal();
    showToast('✅ Evidence attached: ' + name, 'success');
    renderEvidence(document.getElementById('page-content'));
  } catch (err) { showToast('❌ Error: ' + err.message, 'error'); }
}

async function viewEvidenceDetail(id) {
  const all = await getEvidence();
  const e = all.find(x => x.id === id);
  if (!e) return;
  openModal('🔬 Evidence Details',
    `<div>
      ${[['Name',e.name],['FIR',e.fir_number||'—'],['Type',e.type],['Date',e.evidence_date||'—'],['Notes',e.notes||'—'],['Read-only',e.is_readonly?'Yes':'No']]
        .map(([k,v])=>`<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`).join('')}
    </div>
    <div style="text-align:center;padding:16px;font-size:48px;">${e.type==='Photo'?'📷':e.type==='Video'?'🎥':e.type==='Audio'?'🎙️':'📄'}</div>
    <div style="padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:11px;color:var(--text-muted);text-align:center;">🔒 Original file protected in read-only mode</div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button>
     <button class="btn btn-danger btn-sm" onclick="closeModal();doDeleteEvidence('${id}')">🗑️ Delete</button>`
  );
}

async function doDeleteEvidence(id) {
  try { await deleteEvidence(id); showToast('🗑️ Evidence deleted.'); renderEvidence(document.getElementById('page-content')); }
  catch(err) { showToast('❌ Error: ' + err.message, 'error'); }
}

console.log('✅ Evidence Page Loaded');
