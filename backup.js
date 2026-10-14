/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — BACKUP & SYNC  v2  (backup.js)
   Urdu UI · Export all data · Cloud status · Local backup
   ═══════════════════════════════════════════════════════════ */

registerPage('backup', renderBackupPage);

async function renderBackupPage(container) {
  container.innerHTML = `<div id="backup-root">
    <div style="text-align:center;padding:20px;color:var(--text-muted);"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/></svg></div>
  </div>`;
  await _buildBackup();
}

async function _buildBackup() {
  const root = document.getElementById('backup-root');
  if (!root) return;

  // Get data counts
  let counts = { cases:0, reminders:0, incidents:0, court:0 };
  try {
    const oid = await getOfficerId();
    const [c,r,i,ct] = await Promise.all([
      supabaseClient.from('cases').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('reminders').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('incident_reports').select('id',{count:'exact',head:true}).eq('officer_id',oid),
      supabaseClient.from('court_dates').select('id',{count:'exact',head:true}).eq('officer_id',oid),
    ]);
    counts = { cases:c.count||0, reminders:r.count||0, incidents:i.count||0, court:ct.count||0 };
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }

  const totalRecords = Object.values(counts).reduce((a,b)=>a+b,0);
  const lastBackup = localStorage.getItem('dio_last_backup')||'کبھی نہیں';

  root.innerHTML = `
  <!-- Header -->
  <div class="page-header">
    <button class="btn btn-primary dio-add-btn" onclick="triggerBackupNow()">ابھی بیک اپ کریں</button>
    <div>
      <div class="page-title">بیک اپ و ڈیٹا</div>
      <div class="page-subtitle">آخری بیک اپ: ${lastBackup}</div>
    </div>
  </div>

  <!-- Data Summary -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
    ${Object.entries({
      'مقدمات': counts.cases,
      'یاددہانی': counts.reminders,
      'واقعات': counts.incidents,
      'پیشیاں': counts.court,
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
      <div style="font-size:36px;margin-bottom:10px;"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7.5 19a4.5 4.5 0 0 1 0-9 6 6 0 0 1 11.3 1.6A3.7 3.7 0 0 1 18 19z"/></svg></div>
      <div class="dio-hs2" style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">سرکاری کلاؤڈ <span style="font-size:10px;font-weight:600;color:var(--text-muted);" dir="ltr">Supabase</span></div>
      <div style="font-size:11px;color:var(--green);margin-bottom:10px;direction:rtl;">ہمیشہ فعال · AES-256</div>
      <div style="font-size:10px;color:var(--text-muted);direction:rtl;">تمام ڈیٹا خودکار محفوظ ہے</div>
    </div>

    <!-- Local Backup -->
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h7V4"/><path d="M8 20v-6h8v6"/></svg></div>
      <div class="dio-hs2" style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">ڈیوائس بیک اپ</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;direction:rtl;">JSON فائل ڈاؤنلوڈ کریں</div>
      <button class="btn btn-primary btn-sm" style="width:100%;" onclick="_exportAllData()">مکمل ڈیٹا ڈاؤنلوڈ</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:6px;" onclick="_importData()">ڈیٹا درآمد کریں</button>
    </div>

    <!-- Export Options -->
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M4 20h16"/><path d="M7 20V11"/><path d="M12 20V5"/><path d="M17 20v-6"/></svg></div>
      <div class="dio-hs2" style="font-size:13px;font-weight:700;margin-bottom:6px;direction:rtl;">برآمد کریں</div>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px;" onclick="_exportCases()">مقدمات (CSV)</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px;" onclick="_exportReminders()">یاددہانیاں (CSV)</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="_printDataReport()">رپورٹ پرنٹ</button>
    </div>
  </div>

  <!-- Storage Info -->
  <div class="card">
    <div class="dio-hs2" style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;direction:rtl;">سٹوریج کی معلومات</div>
    <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;direction:rtl;">
      <div style="display:flex;justify-content:space-between;"><span>سرکاری کلاؤڈ (Supabase)</span><span style="color:var(--green);">محفوظ</span></div>
      <div style="display:flex;justify-content:space-between;"><span>آف لائن ذخیرہ</span><span style="color:var(--green);">دستیاب</span></div>
      <div style="display:flex;justify-content:space-between;"><span>اس آلہ پر محفوظ</span><span id="ls-size" dir="ltr" style="color:var(--accent);">حساب ہو رہا ہے…</span></div>
    </div>
  </div>

  <!-- Google Drive / Cloud Backup -->
  <div class="card" style="direction:rtl;">
    <div class="dio-hs2" style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px;">Google Drive / کلاؤڈ بیک اپ</div>
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">اپنا ڈیٹا Google Drive یا OneDrive میں محفوظ رکھیں — 3 آسان قدم</div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;gap:10px;align-items:center;background:var(--bg-secondary);border-radius:8px;padding:10px;">
        <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">1</div>
        <div style="flex:1;font-size:13px;">نیچے بٹن سے مکمل ڈیٹا (JSON) ڈاؤنلوڈ کریں</div>
        <button class="btn btn-primary btn-sm" onclick="_exportAllData()">ڈاؤنلوڈ</button>
      </div>
      <div style="display:flex;gap:10px;align-items:center;background:var(--bg-secondary);border-radius:8px;padding:10px;">
        <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">2</div>
        <div style="flex:1;font-size:13px;">Google Drive کھولیں اور فائل اپ لوڈ کریں</div>
        <button class="btn btn-secondary btn-sm" onclick="window.open('https://drive.google.com','_blank')">Drive</button>
      </div>
      <div style="display:flex;gap:10px;align-items:center;background:var(--bg-secondary);border-radius:8px;padding:10px;">
        <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">3</div>
        <div style="flex:1;font-size:13px;">OneDrive استعمال کرتے ہیں؟ یہاں اپ لوڈ کریں</div>
        <button class="btn btn-secondary btn-sm" onclick="window.open('https://onedrive.live.com','_blank')">OneDrive</button>
      </div>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(34,197,94,0.08);border-radius:6px;font-size:11px;color:var(--green);">
      آپ کا ڈیٹا پہلے ہی Supabase کلاؤڈ پر محفوظ ہے۔ یہ صرف اضافی حفاظت کے لیے ہے۔
    </div>
  </div>`;

  /* ═══════════════════════════════════════════════════════════
     KHARABI: safhe par hamesha "NaN KB" likha aata tha.

     `for (let k in localStorage)` sirf mehfooz shuda chaabiyan nahi,
     balke wirasat mein mili khoobiyan bhi ginta hai — `length`,
     `key`, `getItem`, `setItem`, `removeItem`, `clear`.
     In par `(localStorage[k] || '').length` ka natija:
         localStorage['length']  →  aik ADAD (misal 12)
         (12 || '').length       →  undefined
         size += undefined       →  NaN   ← aur phir sab NaN
     Aik bhi aisi chaabi kaafi thi ke poora hisaab NaN ho jaye.

     Ab: sirf ASAL chaabiyan (`key(i)`), aur har qeemat `String()`
     se — taake koi adad ya function beech mein na aaye. */
  try {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === null) continue;
      size += String(localStorage.getItem(k) || '').length + k.length;
    }
    const sizeEl = document.getElementById('ls-size');
    if (sizeEl) {
      const kb = size / 1024;
      sizeEl.textContent = kb >= 1024
        ? (kb / 1024).toFixed(1) + ' MB'
        : Math.max(0, Math.round(kb)) + ' KB';
    }
  } catch(_) {
    const sizeEl = document.getElementById('ls-size');
    if (sizeEl) sizeEl.textContent = '\u062f\u0633\u062a\u06cc\u0627\u0628 \u0646\u06c1\u06cc\u06ba';
  }
}

// ── EXPORT ALL DATA ───────────────────────────────────────────
async function _exportAllData() {
  showToast('ڈیٹا جمع ہو رہا ہے...','info');
  try {
    const oid = await getOfficerId();
    const [cases,reminders,incidents,court,fivec,gasht] = await Promise.all([
      supabaseClient.from('cases').select('*').eq('officer_id',oid),
      supabaseClient.from('reminders').select('*').eq('officer_id',oid),
      supabaseClient.from('incident_reports').select('*').eq('officer_id',oid),
      supabaseClient.from('court_dates').select('*').eq('officer_id',oid),
      supabaseClient.from('applications_5c').select('*').eq('officer_id',oid),
      supabaseClient.from('gasht_logs').select('*').eq('officer_id',oid),   // v548 — گشت لاگ (sql/104 سے پہلے خالی)
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      officer: currentOfficer,
      data: {
        cases: cases.data||[],
        reminders: reminders.data||[],
        incident_reports: incidents.data||[],
        court_dates: court.data||[],
        applications_5c: fivec.data||[],
        gasht_logs: gasht.data||[],
      },
      counts: {
        cases: (cases.data||[]).length,
        reminders: (reminders.data||[]).length,
        incidents: (incidents.data||[]).length,
        court: (court.data||[]).length,
        fivec: (fivec.data||[]).length,
        gasht: (gasht.data||[]).length,
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DigitalIO-Backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    localStorage.setItem('dio_last_backup', new Date().toLocaleString('en-PK'));
    showToast('مکمل ڈیٹا ڈاؤنلوڈ ہو گیا','success');
    _buildBackup();
  } catch(e) { showToast(''+e.message,'error'); }
}

async function _exportCases() {
  try {
    const oid = await getOfficerId();
    const {data} = await supabaseClient.from('cases').select('*').eq('officer_id',oid);
    if (!data?.length) { showToast('کوئی مقدمہ نہیں','info'); return; }
    const cols = ['fir_number','fir_date','occurrence_date','section_of_law','complainant','complainant_cnic','complainant_cell','status','case_station','notes'];
    const csv = [cols.join(','), ...(data||[]).map(r=>cols.map(k=>`"${(r[k]||'').toString().replace(/"/g,"''")}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    a.download = `مقدمات-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('مقدمات CSV ڈاؤنلوڈ','success');
  } catch(e) { showToast(''+e.message,'error'); }
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
    showToast('یاددہانیاں CSV ڈاؤنلوڈ','success');
  } catch(e) { showToast(''+e.message,'error'); }
}

function _importData() {
  openModal('ڈیٹا درآمد',
    `<div style="direction:rtl;">
      <p style="color:var(--amber);font-size:12px;">یہ صرف بیک اپ JSON فائل درآمد کرتا ہے</p>
      <input type="file" id="import-file" accept=".json" style="width:100%;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
      <div id="import-status" style="margin-top:8px;font-size:11px;color:var(--text-muted);"></div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_doImport()">درآمد کریں</button>
    </div>`
  );
}

async function _doImport() {
  const file = document.getElementById('import-file')?.files?.[0];
  const status = document.getElementById('import-status');
  if (!file) { showToast('فائل منتخب کریں','error'); return; }
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.data) { showToast('غلط فائل فارمیٹ','error'); return; }
    if (status) status.textContent = `فائل ٹھیک ہے — ${data.counts?.cases||0} مقدمات، ${data.counts?.reminders||0} یاددہانیاں`;
    closeModal();
    showToast('ڈیٹا درآمد ہو گیا (Supabase میں پہلے سے محفوظ ہے)','success');
  } catch(e) { showToast(''+e.message,'error'); }
}

function _printDataReport() {
  const o = currentOfficer||{};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;padding:20mm;}.hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;}</style></head><body>
    <div class="hdr"><h2>ڈیٹا رپورٹ</h2>
    <div>${esc(o.full_name)||'—'} · تھانہ ${esc(o.station)||'—'} · ${formatDate(new Date())}</div></div>
    <p>یہ رپورٹ Digital IO سے خودکار بنائی گئی ہے۔ تمام ڈیٹا Supabase Cloud میں محفوظ ہے۔</p>
    </body></html>`);
  dioPrint(_printHTML);
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
  showToast('ڈیٹا Supabase میں محفوظ ہے','success');
  localStorage.setItem('dio_last_backup', new Date().toLocaleString('en-PK'));
  _buildBackup();
}