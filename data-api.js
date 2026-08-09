/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ڈیٹا (Supabase سے لینا/محفوظ کرنا)
   مقدمات، یاد دہانیاں، شہادت، ڈیش بورڈ کے اعداد
   (پہلے یہ app-core.js میں تھا)
   AHEM: app-core.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

async function getOfficerId() {
  if (currentOfficer?.id) return currentOfficer.id;
  // Try cached officer (offline / fast path)
  try {
    const cached = JSON.parse(localStorage.getItem('dio_officer_cache')||'null');
    if (cached?.id) {
      if (!currentOfficer) currentOfficer = cached;
      return cached.id;
    }
  } catch(_) {}
  // Resolve user id safely
  let uid = currentUser?.id;
  if (!uid) {
    try { const r = await supabaseClient.auth.getUser(); uid = r.data?.user?.id; } catch(_) {}
  }
  if (!uid) return null;  // Don't query with undefined — prevents 400 errors
  if (!navigator.onLine) return null;  // Can't look up offline without cache
  try {
    const { data } = await supabaseClient.from('officers').select('*').eq('user_id', uid).single();
    if (data?.id) {
      if (!currentOfficer || !currentOfficer.id) currentOfficer = data;
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) {}
      return data.id;
    }
    return null;
  } catch(_) { return null; }
}


async function getCases(status, query) {
  try {
    const oid = await getOfficerId();
    if (!oid) {
      if (typeof offlineStore !== 'undefined') {
        try { return await offlineStore.getAll('cases_cache'); } catch(_) {}
      }
      return [];
    }

    // Helper: filter cached list by status/query
    const filterCached = (all) => {
      if (status) all = all.filter(c => c.status === status);
      if (query) {
        const w = query.toLowerCase();
        all = all.filter(c => (c.fir_number||'').toLowerCase().includes(w) ||
          (c.complainant||'').toLowerCase().includes(w) ||
          (c.section_of_law||'').toLowerCase().includes(w) ||
          (c.complainant_cnic||'').toLowerCase().includes(w) ||
          (c.complainant_cell||'').toLowerCase().includes(w));
      }
      return all.sort((a,b)=> String(a.fir_number||'').localeCompare(String(b.fir_number||''), undefined, {numeric:true}));
    };

    // CACHE-FIRST: try to return cached instantly
    let cached = null;
    if (typeof offlineStore !== 'undefined') {
      try { cached = await offlineStore.getAll('cases_cache', oid); } catch(_) {}
    }

    // If offline — return cache only (instant)
    if (!navigator.onLine) {
      return cached ? filterCached(cached) : [];
    }

    // ONLINE: if we have cache, refresh it in the BACKGROUND (don't block)
    if (cached && cached.length) {
      _refreshCasesInBackground(oid);
      return filterCached(cached);
    }

    // No cache yet — fetch from server now (first ever load)
    let q = supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:false});
    if (status) q = q.eq('status',status);
    if (query) {
      const w = `%${query}%`;
      q = q.or(`fir_number.ilike.${w},complainant.ilike.${w},section_of_law.ilike.${w},complainant_cnic.ilike.${w},complainant_cell.ilike.${w}`);
    }
    const { data } = await q;
    let all = data || [];
    // P9: merge in cases shared with this officer
    try {
      const shared = await _getSharedCases(oid);
      if (shared && shared.length) {
        const ownIds = new Set(all.map(c => c.id));
        shared.forEach(sc => { if (!ownIds.has(sc.id)) all.push(sc); });
      }
    } catch(_) {}
    if (typeof markSynced === 'function') markSynced();
    if (typeof offlineStore !== 'undefined' && all && !status && !query) {
      try { await offlineStore.cache('cases_cache', all); } catch(_) {}
    }
    return all;
  } catch(e) {
    console.error('getCases error:', e);
    return [];
  }
}

// P9: fetch cases shared with this officer (marked with _shared flag + permission)

async function _getSharedCases(oid) {
  try {
    const { data: shares } = await supabaseClient.from('case_shares')
      .select('case_id,permission').eq('shared_with', oid);
    if (!shares || !shares.length) return [];
    const ids = shares.map(s => s.case_id);
    const permMap = {}; shares.forEach(s => { permMap[s.case_id] = s.permission; });
    const { data: cases } = await supabaseClient.from('cases').select('*').in('id', ids);
    return (cases||[]).map(c => ({ ...c, _shared: true, _sharePermission: permMap[c.id] || 'read' }));
  } catch(_) { return []; }
}

// Background refresh — updates cache silently, refreshes UI if cases page open
let _bgRefreshTimer = null;

async function _refreshCasesInBackground(oid) {
  if (_bgRefreshTimer) return; // throttle
  _bgRefreshTimer = setTimeout(()=>{ _bgRefreshTimer = null; }, 2000);
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:false});
    let all = data || [];
    try {
      const shared = await _getSharedCases(oid);
      if (shared && shared.length) {
        const ownIds = new Set(all.map(c => c.id));
        shared.forEach(sc => { if (!ownIds.has(sc.id)) all.push(sc); });
      }
    } catch(_) {}
    if (all && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', all); } catch(_) {}
      if (typeof markSynced === 'function') markSynced();
      // If cases page currently open AND not in a workspace, silently refresh the list
      if (window._activePage === 'cases' && !window._inWorkspace) {
        const c = document.getElementById('page-content');
        if (c && typeof renderCases === 'function') {
          if (!document.querySelector('.workspace-tabs') && !document.querySelector('.modal-overlay[style*="flex"]')) {
            renderCases(c);
          }
        }
      }
    }
  } catch(_) {}
}


async function getCase(id) {
  // CACHE-FIRST: return cached instantly if available
  if (typeof offlineStore !== 'undefined') {
    try {
      const cached = await offlineStore.getOne('cases_cache', id);
      if (cached) {
        // Refresh in background if online
        if (navigator.onLine) {
          supabaseClient.from('cases').select('*').eq('id',id).single()
            .then(({data}) => { if (data) { try { offlineStore.cache('cases_cache', data); } catch(_){} } })
            .catch(()=>{});
        }
        return cached;
      }
    } catch(_) {}
  }
  // Not cached — fetch now
  if (!navigator.onLine) return null;
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('id',id).single();
    if (data && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', data); } catch(_) {}
    }
    return data;
  } catch(_) { return null; }
}


async function addCase(caseData) {
  const oid = await getOfficerId();
  const rec = {...caseData, officer_id:oid};
  // OFFLINE: save locally + queue for sync
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const tempId = 'local-' + Date.now();
    const localRec = { ...rec, id: tempId, created_at: new Date().toISOString(), _pending: true };
    await offlineStore.cache('cases_cache', localRec);
    await offlineStore.enqueue('cases', 'insert', rec);
    showToast('📴 آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    return localRec;
  }
  const { data, error } = await supabaseClient.from('cases').insert(rec).select().single();
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) {} }
  return data;
}


async function updateCase(id, updates) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const existing = await offlineStore.getOne('cases_cache', id) || {};
    const merged = { ...existing, ...updates, id };
    await offlineStore.cache('cases_cache', merged);
    await offlineStore.enqueue('cases', 'update', { id, ...updates });
    showToast('📴 آف لائن محفوظ — sync باقی', 'info');
    return merged;
  }
  const { data, error } = await supabaseClient.from('cases').update(updates).eq('id',id).select().single();
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) {} }
  return data;
}


async function deleteCase(id) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    await offlineStore.remove('cases_cache', id);
    await offlineStore.enqueue('cases', 'delete', { id });
    return;
  }
  const { error } = await supabaseClient.from('cases').delete().eq('id',id);
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.remove('cases_cache', id); } catch(_) {} }
}

let _remindersFailedAt = 0;  // timestamp of last network failure (backoff)


async function getReminders() {
  const oid = await getOfficerId();
  if (!oid) return [];
  const lsKey = 'cache_reminders_' + oid;
  const _fromLS = () => { try { return JSON.parse(localStorage.getItem(lsKey)||'[]'); } catch(_) { return []; } };

  // Offline — use cache, never hit network
  if (!navigator.onLine) {
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) {}
    }
    return _fromLS();
  }
  // Backoff: if a fetch failed in the last 30s, serve cache instead of retrying (stops error spam)
  if (_remindersFailedAt && (Date.now() - _remindersFailedAt) < 30000) {
    return _fromLS();
  }
  try {
    const { data, error } = await supabaseClient.from('reminders').select('*').eq('officer_id',oid).order('reminder_date',{ascending:true});
    if (error) throw error;
    _remindersFailedAt = 0;
    if (data) {
      try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch(_) {}
      if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('reminders_cache', data); } catch(_) {} }
    }
    return data||[];
  } catch(_) {
    // Network failed — mark backoff, fall back to cache
    _remindersFailedAt = Date.now();
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) {}
    }
    return _fromLS();
  }
}

// Reset backoff when connection returns
window.addEventListener('online', () => { _remindersFailedAt = 0; });

// ── EVIDENCE ──────────────────────────────────────────────────

async function getEvidence(firNumber) {
  try {
    const oid = await getOfficerId();
    let q = supabaseClient.from('evidence').select('*').eq('officer_id',oid).order('fir_number',{ascending:true});
    if (firNumber) q = q.eq('fir_number', firNumber);
    const { data } = await q;
    return data||[];
  } catch(_) { return []; }
}


async function addEvidence(ev) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('evidence').insert({...ev, officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}


async function deleteEvidence(id) {
  const { error } = await supabaseClient.from('evidence').delete().eq('id',id);
  if (error) throw error;
}


async function addReminder(rem) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('reminders').insert({...rem,officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}


async function updateReminder(id,updates) {
  const { data,error } = await supabaseClient.from('reminders').update(updates).eq('id',id).select().single();
  if (error) throw error;
  return data;
}


async function deleteReminder(id) {
  const { error } = await supabaseClient.from('reminders').delete().eq('id',id);
  if (error) throw error;
}


async function getDashboardStats() {
  const cases = await getCases();
  const rems = await getReminders();
  return {
    total:    cases.length,
    complete: cases.filter(c=>c.status==='complete').length,
    incomplete:cases.filter(c=>c.status==='incomplete').length,
    under:    cases.filter(c=>c.status==='under').length,
    untrace:  cases.filter(c=>c.status==='untrace').length,
    cancel:   cases.filter(c=>c.status==='cancel').length,
    challan512:cases.filter(c=>c.status==='challan512').length,
    pendingReminders:rems.filter(r=>!r.is_done).length,
  };
}


async function updateOfficerProfile(updates) {
  const oid = await getOfficerId();
  const { data, error } = await supabaseClient.from('officers').update(updates).eq('id',oid).select().single();
  if (error) throw error;
  currentOfficer = {...currentOfficer,...updates,...data};
  return currentOfficer;
}

// ── BADGES ────────────────────────────────────────────────────
