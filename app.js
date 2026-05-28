// ═══════════════════════════════════════════════════
//  DIGITAL IO — MAIN APPLICATION BOOTSTRAP
// ═══════════════════════════════════════════════════

// ── Initialize Application ──
async function initApp() {
  try {
    // Update UI with officer profile
    updateSidebarProfile();

    // Update connection status
    updateConnectionStatus(true);

    // Update badges
    await updateBadges();

    // Start clock
    startClock();

    // Initialize backup system
    initBackupSystem();

    // Setup real-time sync
    setupRealtimeSync(async (table) => {
      await updateBadges();
      // Refresh current page if it shows this data
      const currentPage = document.getElementById('topbar-title')?.textContent;
      if (table === 'cases' && currentPage?.includes('Cases')) {
        renderCases(document.getElementById('page-content'));
      }
      if (table === 'reminders' && currentPage?.includes('Reminder')) {
        renderReminders(document.getElementById('page-content'));
      }
    });

    // Show dashboard
    showPage('dashboard', document.querySelector('.nav-item'));

    // Trigger initial backup
    setTimeout(() => triggerBackup('app_initialized'), 3000);

    console.log('✅ Digital IO App Initialized');
  } catch (err) {
    console.error('App init error:', err);
    showToast('⚠️ App initialization error: ' + err.message, 'error');
  }
}

// ── Monitor online/offline status ──
window.addEventListener('online', () => {
  updateConnectionStatus(true);
  showToast('🌐 Back online — syncing data...', 'success');
  triggerBackup('back_online');
});

window.addEventListener('offline', () => {
  updateConnectionStatus(false);
  showToast('📴 You are offline. Data will sync when connection is restored.', 'error', 5000);
});

// ── PWA Service Worker Registration ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker registered'))
      .catch(err => console.log('Service Worker not available:', err));
  });
}

// ── Start the app ──
window.addEventListener('DOMContentLoaded', async () => {
  // Check for existing session
  await checkExistingSession();

  // Update footer time
  setInterval(() => {
    const el = document.getElementById('footer-time');
    if (el) el.textContent = new Date().toLocaleTimeString('en-PK');
  }, 1000);

  console.log('✅ Digital IO v4.0 — Police Case Management System');
  console.log('✅ Security: AES-256 · MFA · RLS · Audit Logging');
  console.log('✅ Platform: PWA — Desktop + Mobile Ready');
});
