/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — NOTIFICATIONS CENTER
   Central inbox for reminders, court dates, pending tasks
   ═══════════════════════════════════════════════════════════ */

/* ── NISHAN: har jagah SVG, emoji nahi ───────────────────────────
   QAIDA (poore system ka): nishan hamesha SVG ho. Emoji har aale par
   apni shakl badalta hai (Windows/Android/iPhone sab alag), rang theme
   ke sath nahi chalta, aur chhapai mein tootta hai. SVG `currentColor`
   leta hai — is liye wohi rang jo notification ka rang hai.
   Shakls baqi system se hi li gayi hain (aik jaisi dikhen):
     tanbeeh + talash — mojooda system ke nishan
     taraazu        — reminders.js wala
     ghanti         — isi andaz mein (stroke 1.9, 16×16)            */
const _NOTIF_SVG = {
  warn:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 4L3 19.5h18z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/></svg>',
  bell:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M6.5 10a5.5 5.5 0 0 1 11 0v4l1.5 2.5h-14L6.5 14z"/><path d="M10 19.5a2 2 0 0 0 4 0"/></svg>',
  scale: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 4v16"/><path d="M6 20h12"/><path d="M4 9l3-4 3 4"/><path d="M14 9l3-4 3 4"/><path d="M4 9a3 3 0 0 0 6 0"/><path d="M14 9a3 3 0 0 0 6 0"/></svg>',
  find:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
};

// Gather all notifications from across the app
async function _gatherNotifications() {
  const notifs = [];
  const today = new Date().toISOString().split('T')[0];

  // INTERNET band ho to network par koshish hi na karo — warna har request
  // baar baar nakaam ho kar console bhar deti hai aur battery zaya karti hai.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    try {
      const c = JSON.parse(localStorage.getItem('dio_notifs_cache') || '[]');
      return Array.isArray(c) ? c : [];
    } catch (_) { return []; }
  }

  try {
    // 1. Pending reminders
    const reminders = await getReminders().catch(()=>[]);
    reminders.filter(r => !r.is_done).forEach(r => {
      const overdue = r.reminder_date && r.reminder_date < today;
      notifs.push({
        icon: overdue ? _NOTIF_SVG.warn : _NOTIF_SVG.bell,
        title: r.text || 'یاددہانی',
        date: r.reminder_date,
        type: overdue ? 'overdue' : 'reminder',
        color: overdue ? 'var(--red)' : 'var(--accent)',
        action: `showPage('reminders',null)`,
      });
    });
  } catch(_) {}

  try {
    // 2. Upcoming court dates
    const oid = await getOfficerId();
    const { data: courtDates } = await supabaseClient.from('court_dates')
      .select('*').eq('officer_id', oid).gte('hearing_date', today)
      .order('hearing_date', { ascending: true }).limit(10);
    (courtDates || []).forEach(cd => {
      const days = Math.ceil((new Date(cd.hearing_date) - new Date()) / 86400000);
      notifs.push({
        icon: _NOTIF_SVG.scale,
        title: `پیشی: ${cd.case_title || cd.fir_number || 'مقدمہ'}`,
        date: cd.hearing_date,
        subtitle: days === 0 ? 'آج' : days === 1 ? 'کل' : `${days} دن بعد`,
        type: 'court',
        color: days <= 1 ? 'var(--red)' : 'var(--amber)',
        action: `showPage('court',null)`,
      });
    });
  } catch(_) {}

  try {
    // 3. Cases pending 173 / 15-day reminders
    const cases = await getCases().catch(()=>[]);
    cases.filter(c => c.status === 'under').slice(0, 5).forEach(c => {
      notifs.push({
        icon: _NOTIF_SVG.find,
        title: `زیر تفتیش: FIR ${c.fir_number || '—'}`,
        date: c.fir_date,
        subtitle: 'تفتیش جاری',
        type: 'case',
        color: 'var(--accent)',
        action: `openCaseWorkspace('${c.id}')`,
      });
    });
  } catch(_) {}

  // Sort: overdue/urgent first, then by date
  const priority = { overdue: 0, court: 1, reminder: 2, case: 3 };
  notifs.sort((a, b) => (priority[a.type] - priority[b.type]) || ((a.date||'') < (b.date||'') ? -1 : 1));

  try { localStorage.setItem('dio_notifs_cache', JSON.stringify(notifs)); } catch (_) {}
  return notifs;
}

// Open the notification center modal
async function updateNotifBadge() {
  try {
    const notifs = await _gatherNotifications();
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const urgent = notifs.filter(n => n.type === 'overdue' || n.type === 'court').length;
    const count = notifs.length;
    if (count > 0) {
      badge.style.display = 'block';
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.background = urgent > 0 ? 'var(--red)' : 'var(--accent)';
    } else {
      badge.style.display = 'none';
    }
  } catch(_) {}
}

// Auto-update badge every 2 minutes
setInterval(() => { if (currentUser && navigator.onLine) updateNotifBadge(); }, 120000);
