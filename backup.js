// ═══════════════════════════════════════════════════
//  DIGITAL IO — REAL-TIME BACKUP SYSTEM
//  Backs up to Google Drive on every data change
// ═══════════════════════════════════════════════════

let backupQueue = [];
let backupInProgress = false;
let lastBackupTime = null;
let googleDriveToken = null;

// ── Trigger backup on any data change ──
function triggerBackup(reason = 'manual') {
  backupQueue.push({ reason, timestamp: Date.now() });
  processBackupQueue();
}

// ── Process backup queue ──
async function processBackupQueue() {
  if (backupInProgress || backupQueue.length === 0) return;
  backupInProgress = true;

  // Debounce: wait 2 seconds to batch multiple changes
  await sleep(2000);
  backupQueue = [];

  try {
    await performBackup();
  } catch (err) {
    console.error('Backup error:', err);
  }

  backupInProgress = false;

  // Process any new items that came in during backup
  if (backupQueue.length > 0) {
    processBackupQueue();
  }
}

// ── Main backup function ──
async function performBackup() {
  if (!currentUser) return;

  const startTime = Date.now();

  try {
    // Collect all data
    const backupData = await collectBackupData();
    const backupJson = JSON.stringify(backupData);
    const backupSize = new Blob([backupJson]).size;

    // Log backup start
    const { data: logEntry } = await supabaseClient
      .from('backup_log')
      .insert({
        backup_type: 'realtime',
        status: 'in_progress',
        records_backed_up: backupData.summary.totalRecords,
        file_size_kb: Math.round(backupSize / 1024),
        destination: 'google_drive',
        performed_by: currentUser.id,
      })
      .select()
      .single();

    // Upload to Google Drive if connected
    if (googleDriveToken) {
      await uploadToGoogleDrive(backupJson, backupData.summary);
    }

    // Also save to localStorage as local backup
    saveLocalBackup(backupJson);

    // Update backup log
    if (logEntry) {
      await supabaseClient
        .from('backup_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id);
    }

    lastBackupTime = new Date();
    updateBackupIndicator(true);

    console.log(`✅ Backup completed in ${Date.now() - startTime}ms`);

  } catch (err) {
    console.error('Backup failed:', err);
    updateBackupIndicator(false);
  }
}

// ── Collect all data for backup ──
async function collectBackupData() {
  const officerId = await getOfficerId();

  const [cases, evidence, reminders, misalDocs] = await Promise.all([
    getCases(),
    getEvidence(),
    getReminders(),
    getMisal(),
  ]);

  return {
    version: APP_CONFIG.version,
    backupDate: new Date().toISOString(),
    officerId: officerId,
    officerName: currentOfficer?.full_name || 'Unknown',
    station: currentOfficer?.station || 'Unknown',
    summary: {
      totalRecords: cases.length + evidence.length + reminders.length + misalDocs.length,
      cases: cases.length,
      evidence: evidence.length,
      reminders: reminders.length,
      misal: misalDocs.length,
    },
    data: {
      cases,
      evidence,
      reminders,
      misal: misalDocs,
      officer: currentOfficer,
    },
  };
}

// ── Save local backup ──
function saveLocalBackup(jsonData) {
  try {
    const key = `dio_backup_${currentUser?.id}`;
    localStorage.setItem(key, jsonData);
    localStorage.setItem(`${key}_time`, new Date().toISOString());
  } catch (err) {
    console.warn('Local backup storage full:', err);
  }
}

// ── Google Drive Upload ──
async function uploadToGoogleDrive(jsonData, summary) {
  if (!googleDriveToken) return;

  const filename = `DigitalIO_Backup_${currentOfficer?.full_name?.replace(/\s+/g,'_') || 'Officer'}_${new Date().toISOString().slice(0,10)}.json`;

  try {
    // Create/update file in Google Drive
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonData +
      closeDelim;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleDriveToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) throw new Error('Google Drive upload failed');

    console.log('✅ Backed up to Google Drive:', filename);

  } catch (err) {
    console.error('Google Drive backup error:', err);
    throw err;
  }
}

// ── Connect Google Drive ──
async function connectGoogleDrive() {
  const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // To be configured

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',
    include_granted_scopes: 'true',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // Open OAuth popup
  const popup = window.open(authUrl, 'Google Drive Auth', 'width=500,height=600,left=200,top=100');

  // Listen for token
  const tokenListener = setInterval(() => {
    try {
      const popupUrl = popup.location.href;
      if (popupUrl.includes('access_token')) {
        const token = new URLSearchParams(popup.location.hash.slice(1)).get('access_token');
        if (token) {
          googleDriveToken = token;
          localStorage.setItem('dio_gdrive_token', token);
          popup.close();
          clearInterval(tokenListener);
          showToast('✅ Google Drive connected! Real-time backup active.', 'success');
          triggerBackup('google_drive_connected');
        }
      }
    } catch (e) {}

    if (popup.closed) clearInterval(tokenListener);
  }, 500);
}

// ── Disconnect Google Drive ──
function disconnectGoogleDrive() {
  googleDriveToken = null;
  localStorage.removeItem('dio_gdrive_token');
  showToast('Google Drive disconnected.', 'info');
}

// ── Manual backup trigger ──
async function triggerBackupNow() {
  showToast('⏳ Backing up all data...', 'info', 2000);
  await performBackup();
  showToast('✅ Backup complete!', 'success');
}

// ── Update backup indicator in topbar ──
function updateBackupIndicator(success) {
  const btn = document.querySelector('.topbar-btn[onclick="triggerBackupNow()"]');
  if (!btn) return;
  btn.title = success
    ? `Last backup: ${lastBackupTime?.toLocaleTimeString('en-PK')}`
    : 'Backup failed — click to retry';
  btn.style.color = success ? 'var(--green)' : 'var(--amber)';
}

// ── Restore from backup ──
async function restoreFromLocalBackup() {
  const key = `dio_backup_${currentUser?.id}`;
  const backupJson = localStorage.getItem(key);
  if (!backupJson) {
    showToast('⚠️ No local backup found.', 'error');
    return;
  }

  try {
    const backup = JSON.parse(backupJson);
    const backupTime = localStorage.getItem(`${key}_time`);
    showToast(`✅ Backup found from ${formatDate(backupTime)}. Contact admin to restore.`, 'info', 5000);
  } catch (err) {
    showToast('❌ Backup file corrupted.', 'error');
  }
}

// ── Get backup status ──
function getBackupStatus() {
  return {
    lastBackup: lastBackupTime,
    googleDriveConnected: !!googleDriveToken,
    localBackupExists: !!localStorage.getItem(`dio_backup_${currentUser?.id}`),
  };
}

// ── Helper ──
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ── Restore Google Drive token from storage ──
function initBackupSystem() {
  const storedToken = localStorage.getItem('dio_gdrive_token');
  if (storedToken) {
    googleDriveToken = storedToken;
    console.log('✅ Google Drive backup token restored');
  }
}

console.log('✅ Backup System Loaded');
