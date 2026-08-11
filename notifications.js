/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — NOTIFICATIONS CENTER
   Central inbox for reminders, court dates, pending tasks
   ═══════════════════════════════════════════════════════════ */

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
        icon: overdue ? '⚠️' : '🔔',
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
        icon: '⚖️',
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
        icon: '🔍',
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
