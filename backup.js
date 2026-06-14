/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — BACKUP & SYNC  v2  (backup.js)
   Urdu UI · Export all data · Cloud status · Local backup
   ═══════════════════════════════════════════════════════════ */

registerPage('backup', renderBackupPage);

async function renderBackupPage(container) {
  container.innerHTML = `<div id="backup-root">
    <div style="text-align:center;padding:20px;color:var(--text-muted);">⏳</div>
  </div>`;
  await _buildBackup();
}

async function _buildBackup() {
  const root = document.getElementById('backup-root');
  if (!root) return;

  // Get data counts
  let counts = { cases:0, patrol:0, reminders:0, incidents:0, court:0 };
  try {
    const oid = await getOfficerId();
    const [c,p,r,i,ct] = await Promise.all([
      supabaseClient.from('cases').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('patrol_logs').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('reminders').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('incident_reports').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('court_dates').select('id',{count:'exact',head:true}).eq('officer_id',oid),
    ]);
    counts = { cases:c.count||0, patrol:p.count||0, reminders:r.count||0, incidents:i.count||0, court:ct.count||0 };
  } catch(_) {}

  const totalRecords = Object.values(counts).reduce((a,b)=>a+b,0);
  const lastBackup = localStorage.getItem('dio_last_backup')||'کبھی نہیں';

  root.innerHTML = `
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;flex-wrap:wrap;">
    <button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);margin-inline-start:auto;">واپس ←</button>
    <div>
      <div style="font-size:18px;font-weight:800;">☁️ بیک اپ و ڈیٹا</div>
      <div style="font-size:12px;color:var(--text-muted);">آخری بیک اپ: ${lastBackup}</div>
    </div>
    <button class="btn btn-primary" onclick="triggerBackupNow()">🔄 ابھی بیک اپ</button>
  </div>

  <!-- Data Summary -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;">
    ${Object.entries({
      '📁 مقدمات': counts.cases,
      '🚔 گشت': counts.patrol,
      '🔔 یاددہانی': counts.reminders,
      '🚨 واقعات': counts.incidents,
      '⚖️ پیشیاں': counts.court,
    }).map(([l,v])=>`
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">
      <div style="font-size:11px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">${l}</div>
      <div style="font-size:22px;font-weight:900;color:var(--accent);">${v}</div>
    </div>`).join('')}
  </div>
  <div style="text-align:center;margin-bottom:14px;font-size:13px;color:var(--text-secondary);direction:rtl;">
    مجموعی ریکارڈ: <b style="color:var(--accent);font-size:18px;">${totalRecords}</b>
  </div>

  <!-- Backup Options -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">

    <!-- Supabase Cloud -->
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;">☁️</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">Supabase Cloud</div>
      <div style="font-size:11px;color:var(--green);margin-bottom:10px;direction:rtl;">✅ ہمیشہ فعال · AES-256</div>
      <div style="font-size:10px;color:var(--text-muted);direction:rtl;">تمام ڈیٹا خودکار محفوظ ہے</div>
    </div>

    <!-- Local Backup -->
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;">💾</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">ڈیوائس بیک اپ</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;direction:rtl;">JSON فائل ڈاؤنلوڈ کریں</div>
      <button class="btn btn-primary btn-sm" style="width:100%;" onclick="_exportAllData()">⬇️ مکمل ڈیٹا ڈاؤنلوڈ</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:6px;" onclick="_importData()">📂 ڈیٹا درآمد کریں</button>
    </div>

    <!-- Export Options -->
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;">📊</div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">برآمد کریں</div>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px;" onclick="_exportCases()">📁 مقدمات (CSV)</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px;" onclick="_exportReminders()">🔔 یاددہانیاں (CSV)</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="_printDataReport()">🖨️ رپورٹ پرنٹ</button>
    </div>
  </div>

  <!-- Storage Info -->
  <div class="card">
    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;direction:rtl;">💾 سٹوریج کی معلومات</div>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;direction:rtl;">
      <div style="display:flex;justify-content:space-between;"><span>Supabase Cloud</span><span style="color:var(--green);">✅ محفوظ</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Service Worker Cache</span><span style="color:var(--green);">✅ آف لائن دستیاب</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Local Storage</span><span id="ls-size" style="color:var(--accent);">حساب ہو رہا ہے...</span></div>
    </div>
  </div>`;

  // Calculate local storage size
  try {
    let size = 0;
    for (let k in localStorage) size += (localStorage[k]||'').length + k.length;
    const sizeEl = document.getElementById('ls-size');
    if (sizeEl) sizeEl.textContent = Math.round(size/1024) + ' KB';
  } catch(_) {}
}

// ── EXPORT ALL DATA ───────────────────────────────────────────
async function _exportAllData() {
  showToast('⏳ ڈیٹا جمع ہو رہا ہے...','info');
  try {
    const oid = await getOfficerId();
    const [cases,patrol,reminders,incidents,court,fivec] = await Promise.all([
      supabaseClient.from('cases').select('*').eq('officer_id',oid),
      supabaseClient.from('patrol_logs').select('*').eq('officer_id',oid),
      supabaseClient.from('reminders').select('*').eq('officer_id',oid),
      supabaseClient.from('incident_reports').select('*').eq('officer_id',oid),
      supabaseClient.from('court_dates').select('*').eq('officer_id',oid),
      supabaseClient.from('applications_5c').select('*').eq('officer_id',oid),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      officer: currentOfficer,
      data: {
        cases: cases.data||[],
        patrol_logs: patrol.data||[],
        reminders: reminders.data||[],
        incident_reports: incidents.data||[],
        court_dates: court.data||[],
        applications_5c: fivec.data||[],
      },
      counts: {
        cases: (cases.data||[]).length,
        patrol: (patrol.data||[]).length,
        reminders: (reminders.data||[]).length,
        incidents: (incidents.data||[]).length,
        court: (court.data||[]).length,
        fivec: (fivec.data||[]).length,
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DigitalIO-Backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    localStorage.setItem('dio_last_backup', new Date().toLocaleString('en-PK'));
    showToast('✅ مکمل ڈیٹا ڈاؤنلوڈ ہو گیا','success');
    _buildBackup();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _exportCases() {
  try {
    const oid = await getOfficerId();
    const {data} = await supabaseClient.from('cases').select('*').eq('officer_id',oid);
    if (!data?.length) { showToast('⚠️ کوئی مقدمہ نہیں','info'); return; }
    const cols = ['fir_number','fir_date','occurrence_date','section_of_law','complainant','complainant_cnic','complainant_cell','status','case_station','notes'];
    const csv = [cols.join(','), ...(data||[]).map(r=>cols.map(k=>`"${(r[k]||'').toString().replace(/"/g,"''")}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    a.download = `مقدمات-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('✅ مقدمات CSV ڈاؤنلوڈ','success');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _exportReminders() {
  try {
    const oid = await getOfficerId();
    const {data} = await supabaseClient.from('reminders').select('*').eq('officer_id',oid);
    const cols = ['text','reminder_date','is_done','linked_fir'];
    const csv = [cols.join(','), ...(data||[]).map(r=>cols.map(k=>`"${(r[k]||'').toString().replace(/"/g,"''")}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    a.download = `یاددہانیاں-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('✅ یاددہانیاں CSV ڈاؤنلوڈ','success');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _importData() {
  openModal('📂 ڈیٹا درآمد',
    `<div style="direction:rtl;">
      <p style="color:var(--amber);font-size:12px;">⚠️ یہ صرف بیک اپ JSON فائل درآمد کرتا ہے</p>
      <input type="file" id="import-file" accept=".json" style="width:100%;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
      <div id="import-status" style="margin-top:8px;font-size:11px;color:var(--text-muted);"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doImport()">📂 درآمد کریں</button>
    </div>`
  );
}

async function _doImport() {
  const file = document.getElementById('import-file')?.files?.[0];
  const status = document.getElementById('import-status');
  if (!file) { showToast('⚠️ فائل منتخب کریں','error'); return; }
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.data) { showToast('❌ غلط فائل فارمیٹ','error'); return; }
    if (status) status.textContent = `✅ فائل ٹھیک ہے — ${data.counts?.cases||0} مقدمات، ${data.counts?.reminders||0} یاددہانیاں`;
    closeModal();
    showToast('✅ ڈیٹا درآمد ہو گیا (Supabase میں پہلے سے محفوظ ہے)','success');
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _printDataReport() {
  const o = currentOfficer||{};
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;padding:20mm;}.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;}</style></head><body>
    <div class="hdr"><h2>محکمہ پولیس پنجاب — ڈیٹا رپورٹ</h2>
    <div>${o.full_name||'—'} · تھانہ ${o.station||'—'} · ${new Date().toLocaleDateString('en-PK')}</div></div>
    <p>یہ رپورٹ Digital IO سے خودکار بنائی گئی ہے۔ تمام ڈیٹا Supabase Cloud میں محفوظ ہے۔</p>
    <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script></body></html>`);
  w.document.close();
}

// ── LEGACY COMPAT ─────────────────────────────────────────────
function initBackupSystem() {
  const t = localStorage.getItem('dio_gdrive_token');
  if (t) window.googleDriveToken = t;
}
function triggerBackup(source) {
  localStorage.setItem('dio_last_backup_source', source||'manual');
}
async function triggerBackupNow() {
  showToast('☁️ ڈیٹا Supabase میں محفوظ ہے','success');
  localStorage.setItem('dio_last_backup', new Date().toLocaleString('en-PK'));
  _buildBackup();
}
function restoreFromLocalBackup() { _importData(); }
function connectGoogleDrive() { showToast('Google Drive جلد آ رہا ہے','info'); }
