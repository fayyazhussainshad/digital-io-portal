// ═══════════════════════════════════════════════════
//  DIGITAL IO — UI UTILITIES
// ═══════════════════════════════════════════════════

// ── Toast Notifications ──
function showToast(msg, type = 'info', duration = APP_CONFIG.toastDuration) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal ──
function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modal-root').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    </div>`;
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ── Page Router ──
const pageTitles = {
  dashboard:   '🏠 Dashboard',
  cases:       '📁 My Cases',
  misal:       '📄 MISAL Builder',
  evidence:    '🔬 Evidence & Media',
  search:      '🔍 Advanced Search',
  law:         '⚖️ Law & Reference Library',
  reminders:   '🔔 Reminders',
  performance: '📊 Performance Tracker',
  backup:      '☁️ Backup & Cloud Sync',
  settings:    '⚙️ Settings',
  admin:       '👨‍💼 Admin Panel',
};

const pageRenderers = {};

function registerPage(name, renderer) {
  pageRenderers[name] = renderer;
}

function showPage(page, el) {
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick')?.includes(`'${page}'`)) n.classList.add('active');
    });
  }

  // Update topbar title
  document.getElementById('topbar-title').textContent = pageTitles[page] || page;

  // Show loading
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading ${pageTitles[page] || page}...</div>
    </div>`;

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  // Render page
  if (pageRenderers[page]) {
    pageRenderers[page](content);
  } else {
    content.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">🚧</div>
        <div style="font-size:16px;font-weight:600;">Coming Soon</div>
        <div style="font-size:12px;margin-top:6px;">${pageTitles[page] || page} is being built.</div>
      </div>`;
  }

  // Reset session timer
  resetSessionTimer();
}

// ── Mobile Sidebar Toggle ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Update Topbar Status ──
function updateConnectionStatus(connected) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (dot) dot.style.background = connected ? 'var(--green)' : 'var(--red)';
  if (text) text.textContent = connected ? 'Online' : 'Offline';
}

// ── Update Badges ──
async function updateBadges() {
  try {
    const cases = await getCases();
    const reminders = await getReminders(false);

    const caseBadge = document.getElementById('badge-cases');
    const reminderBadge = document.getElementById('badge-reminders');
    if (caseBadge) caseBadge.textContent = cases.length;
    if (reminderBadge) reminderBadge.textContent = reminders.length;
  } catch (err) {}
}

// ── Clock ──
function startClock() {
  function updateClock() {
    const el = document.getElementById('footer-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ── Format Helpers ──
function formatCNIC(val) {
  if (!val) return '—';
  const d = val.replace(/\D/g, '');
  if (d.length === 13) return `${d.slice(0,5)}-${d.slice(5,12)}-${d.slice(12)}`;
  return val;
}

function formatCell(val) {
  if (!val) return '—';
  const d = val.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0,4)}-${d.slice(4)}`;
  return val;
}

function autoFormatCNIC(inp) {
  let v = inp.value.replace(/\D/g, '').slice(0, 13);
  if (v.length > 12) v = `${v.slice(0,5)}-${v.slice(5,12)}-${v.slice(12)}`;
  else if (v.length > 5) v = `${v.slice(0,5)}-${v.slice(5)}`;
  inp.value = v;
}

function autoFormatCell(inp) {
  let v = inp.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 4) v = `${v.slice(0,4)}-${v.slice(4)}`;
  inp.value = v;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Sidebar Profile Update ──
function updateSidebarProfile() {
  if (!currentOfficer) return;

  const nameEl = document.getElementById('sidebar-name');
  const roleEl = document.getElementById('sidebar-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  const footerEl = document.getElementById('footer-officer');

  if (nameEl) nameEl.textContent = currentOfficer.full_name || 'Officer';
  if (roleEl) roleEl.textContent = currentOfficer.designation || currentRole;
  if (footerEl) footerEl.textContent = `Officer: ${currentOfficer.full_name || '—'} · ${currentOfficer.station || '—'}`;

  // Profile photo
  const photoSrc = localStorage.getItem('dio_profile_photo');
  if (photoSrc && avatarEl) {
    avatarEl.innerHTML = `<img src="${photoSrc}" alt="">`;
  } else if (avatarEl && currentOfficer.full_name) {
    const initials = currentOfficer.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.textContent = initials;
  }

  // Show admin nav if admin
  if (currentRole === 'admin' || currentRole === 'superadmin') {
    const adminNav = document.getElementById('admin-nav-item');
    if (adminNav) adminNav.style.display = 'flex';
  }

  // Store officer name for login screen
  if (currentOfficer.full_name) {
    localStorage.setItem('dio_officer_name', currentOfficer.full_name);
  }
}

// ── Confirm Dialog ──
function confirmAction(title, message, onConfirm, danger = false) {
  openModal(title,
    `<p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">${message}</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="closeModal();(${onConfirm.toString()})()">Confirm</button>`
  );
}

// ── News Ticker ──
function startNewsTicker() {
  const el = document.getElementById('news-ticker');
  if (!el) return;
  el.textContent = POLICE_NEWS.join(' ✦ ');
}

// ── Print Helper ──
function printContent(html, title = 'Digital IO — Print') {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
      h1 { font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th, td { padding: 8px; border: 1px solid #ddd; font-size: 12px; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .watermark { position: fixed; bottom: 20px; right: 20px; font-size: 10px; color: #ccc; }
    </style></head>
    <body>
      <div class="header">
        <div><strong>Digital IO — Police Case Management System</strong></div>
        <div style="font-size:11px;color:#555;">Printed: ${new Date().toLocaleString('en-PK')}</div>
      </div>
      ${html}
      <div class="watermark">Digital IO · Confidential · ${currentOfficer?.full_name || 'Officer'} · ${new Date().toLocaleDateString('en-PK')}</div>
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

console.log('✅ UI Layer Loaded');
