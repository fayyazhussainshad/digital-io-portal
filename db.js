// ═══════════════════════════════════════════════════
//  DIGITAL IO — DATABASE OPERATIONS
// ═══════════════════════════════════════════════════

// ── Get current officer ID ──
async function getOfficerId() {
  if (currentOfficer) return currentOfficer.id;
  if (!currentUser) return null;
  const { data } = await supabaseClient
    .from('officers')
    .select('id')
    .eq('user_id', currentUser.id)
    .single();
  return data?.id || null;
}

// ════════════════════════════════════════════
//  CASES
// ════════════════════════════════════════════

async function getCases(filterStatus = '', filterSearch = '') {
  const officerId = await getOfficerId();
  if (!officerId) return [];

  let query = supabaseClient
    .from('cases_decrypted')
    .select('*')
    .eq('officer_id', officerId)
    .order('created_at', { ascending: false });

  if (filterStatus) query = query.eq('status', filterStatus);

  const { data, error } = await query;
  if (error) { console.error('getCases error:', error); return []; }

  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    return (data || []).filter(c =>
      c.fir_number?.toLowerCase().includes(s) ||
      c.accused_name?.toLowerCase().includes(s) ||
      c.accused_cnic?.toLowerCase().includes(s) ||
      c.section_of_law?.toLowerCase().includes(s) ||
      c.offence_type?.toLowerCase().includes(s) ||
      c.complainant?.toLowerCase().includes(s)
    );
  }

  return data || [];
}

async function getCase(id) {
  const { data, error } = await supabaseClient
    .from('cases_decrypted')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

async function addCase(caseData) {
  const officerId = await getOfficerId();
  if (!officerId) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('cases')
    .insert({ ...caseData, officer_id: officerId })
    .select()
    .single();

  if (error) throw error;
  triggerBackup('case_added');
  return data;
}

async function updateCase(id, caseData) {
  const { data, error } = await supabaseClient
    .from('cases')
    .update({ ...caseData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  triggerBackup('case_updated');
  return data;
}

async function deleteCase(id) {
  const { error } = await supabaseClient
    .from('cases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  triggerBackup('case_deleted');
}

// ════════════════════════════════════════════
//  EVIDENCE
// ════════════════════════════════════════════

async function getEvidence(firNumber = '') {
  const officerId = await getOfficerId();
  if (!officerId) return [];

  let query = supabaseClient
    .from('evidence')
    .select('*')
    .eq('officer_id', officerId)
    .order('created_at', { ascending: false });

  if (firNumber) query = query.eq('fir_number', firNumber);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

async function addEvidence(evidenceData) {
  const officerId = await getOfficerId();
  if (!officerId) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('evidence')
    .insert({ ...evidenceData, officer_id: officerId })
    .select()
    .single();

  if (error) throw error;
  triggerBackup('evidence_added');
  return data;
}

async function deleteEvidence(id) {
  const { error } = await supabaseClient
    .from('evidence')
    .delete()
    .eq('id', id);

  if (error) throw error;
  triggerBackup('evidence_deleted');
}

// ════════════════════════════════════════════
//  REMINDERS
// ════════════════════════════════════════════

async function getReminders(doneFilter = null) {
  const officerId = await getOfficerId();
  if (!officerId) return [];

  let query = supabaseClient
    .from('reminders')
    .select('*')
    .eq('officer_id', officerId)
    .order('reminder_date', { ascending: true });

  if (doneFilter !== null) query = query.eq('is_done', doneFilter);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

async function addReminder(reminderData) {
  const officerId = await getOfficerId();
  if (!officerId) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('reminders')
    .insert({ ...reminderData, officer_id: officerId })
    .select()
    .single();

  if (error) throw error;
  triggerBackup('reminder_added');
  return data;
}

async function updateReminder(id, updates) {
  const { data, error } = await supabaseClient
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteReminder(id) {
  const { error } = await supabaseClient
    .from('reminders')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ════════════════════════════════════════════
//  MISAL
// ════════════════════════════════════════════

async function getMisal(firNumber = '') {
  const officerId = await getOfficerId();
  if (!officerId) return [];

  let query = supabaseClient
    .from('misal')
    .select('*')
    .eq('officer_id', officerId)
    .order('saved_at', { ascending: false });

  if (firNumber) query = query.eq('fir_number', firNumber);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

async function saveMisal(misalData) {
  const officerId = await getOfficerId();
  if (!officerId) throw new Error('Not authenticated');

  const { data, error } = await supabaseClient
    .from('misal')
    .insert({ ...misalData, officer_id: officerId })
    .select()
    .single();

  if (error) throw error;
  triggerBackup('misal_saved');
  return data;
}

// ════════════════════════════════════════════
//  OFFICER PROFILE
// ════════════════════════════════════════════

async function updateOfficerProfile(updates) {
  const { data, error } = await supabaseClient
    .from('officers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', currentUser.id)
    .select()
    .single();

  if (error) throw error;
  currentOfficer = data;
  return data;
}

// ════════════════════════════════════════════
//  ADVANCED SEARCH
// ════════════════════════════════════════════

async function advancedSearch(params) {
  const officerId = await getOfficerId();
  if (!officerId) return [];

  let cases = await getCases();

  if (params.fir) cases = cases.filter(c => c.fir_number?.toLowerCase().includes(params.fir.toLowerCase()));
  if (params.name) cases = cases.filter(c =>
    c.accused_name?.toLowerCase().includes(params.name.toLowerCase()) ||
    c.complainant?.toLowerCase().includes(params.name.toLowerCase())
  );
  if (params.cnic) cases = cases.filter(c => c.accused_cnic?.includes(params.cnic));
  if (params.cell) cases = cases.filter(c => c.accused_cell?.includes(params.cell));
  if (params.status) cases = cases.filter(c => c.status === params.status);
  if (params.section) cases = cases.filter(c => c.section_of_law?.toLowerCase().includes(params.section.toLowerCase()));

  if (params.sort === 'desc') cases.reverse();

  return cases;
}

// ════════════════════════════════════════════
//  STATS FOR DASHBOARD
// ════════════════════════════════════════════

async function getDashboardStats() {
  const cases = await getCases();
  const reminders = await getReminders(false);

  return {
    total: cases.length,
    under: cases.filter(c => c.status === 'under').length,
    complete: cases.filter(c => c.status === 'complete').length,
    incomplete: cases.filter(c => c.status === 'incomplete').length,
    untrace: cases.filter(c => c.status === 'untrace').length,
    cancel: cases.filter(c => c.status === 'cancel').length,
    pendingReminders: reminders.length,
    cases,
    reminders: reminders.slice(0, 5),
  };
}

// ════════════════════════════════════════════
//  ADMIN FUNCTIONS
// ════════════════════════════════════════════

async function getAdminStats() {
  if (currentRole !== 'admin' && currentRole !== 'superadmin') return null;

  const { data: officers } = await supabaseClient.from('officers').select('*');
  const { data: cases } = await supabaseClient.from('cases').select('id, status');
  const { data: auditLogs } = await supabaseClient
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    totalOfficers: officers?.length || 0,
    totalCases: cases?.length || 0,
    activeCases: cases?.filter(c => c.status === 'under').length || 0,
    completedCases: cases?.filter(c => c.status === 'complete').length || 0,
    officers: officers || [],
    recentActivity: auditLogs || [],
  };
}

// ════════════════════════════════════════════
//  REAL-TIME SUBSCRIPTIONS
// ════════════════════════════════════════════

let realtimeSubscription = null;

function setupRealtimeSync(onUpdate) {
  if (realtimeSubscription) realtimeSubscription.unsubscribe();

  realtimeSubscription = supabaseClient
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
      if (onUpdate) onUpdate('cases');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => {
      if (onUpdate) onUpdate('reminders');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence' }, () => {
      if (onUpdate) onUpdate('evidence');
    })
    .subscribe();
}

console.log('✅ Database Layer Loaded');
