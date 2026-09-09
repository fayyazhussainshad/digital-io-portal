/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — DOCUMENT APPROVAL helper  (dio-approvals.js)
   Phase 4H

   DIO.approvals.request(docKey, {label, case_id, fir_number})
       — IO ek document ko manzoori ke liye bhejta hai. Returns the
         created row (or null on failure).
   DIO.approvals.decide(id, 'approved'|'rejected', note)
       — admin/SHO faisla karta hai (RLS sirf same-station admin ko dega).
   DIO.approvals.latestFor(docKey)  — us document ki taaza request.
   DIO.approvals.pending(station)   — station ke pending requests.
   DIO.approvals.statusLabel(s) / statusColor(s) / badge(s)

   Table: document_approvals (document_approvals.sql).
   Har call defensive & silent-fail — approval feature fail ho to bhi
   baaqi app chalti rahe.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  window.DIO = window.DIO || {};
  if (DIO.approvals) return;

  var LABELS = { pending:'زیرِ منظوری', approved:'منظور شدہ', rejected:'مسترد' };
  var COLORS = { pending:'var(--amber,#f59e0b)', approved:'var(--green,#16a34a)', rejected:'var(--red,#dc2626)' };
  var ICONS  = { pending:'⏳', approved:'✅', rejected:'❌' };

  function statusLabel(s) { return LABELS[s] || s || '—'; }
  function statusColor(s) { return COLORS[s] || 'var(--text-muted)'; }
  function statusIcon(s)  { return ICONS[s]  || '•'; }

  function badge(s) {
    var c = statusColor(s);
    return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;' +
           'color:' + c + ';background:rgba(0,0,0,0.04);border:1px solid ' + c + ';border-radius:10px;padding:1px 9px;">' +
           statusIcon(s) + ' ' + statusLabel(s) + '</span>';
  }

  async function _me() {
    var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    var id = o.id || null;
    try { if (typeof getOfficerId === 'function') id = (await getOfficerId()) || id; } catch (_) {}
    return { id: id, name: o.full_name || '', role: o.role || '', station: o.station || '' };
  }

  // Create an approval request. Returns the row, or null.
  async function request(docKey, opts) {
    opts = opts || {};
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient || !docKey) return null;
      var me = await _me();
      if (!me.id) return null;
      var row = {
        document_key:      String(docKey),
        document_label:    opts.label || null,
        case_id:           opts.case_id || null,
        fir_number:        opts.fir_number || null,
        station:           me.station || null,
        requested_by:      me.id,
        requested_by_name: me.name,
        status:            'pending'
      };
      var res = await supabaseClient.from('document_approvals').insert(row).select().single();
      if (res && res.error) { _log('approvals.request', res.error); return null; }
      // Audit trail (agar available ho)
      try {
        if (DIO.audit) DIO.audit.log('document.approval_requested', 'document', String(docKey),
          { case_id: opts.case_id || null, metadata: { label: opts.label || null } });
      } catch (_) {}
      return (res && res.data) || null;
    } catch (e) { _log('approvals.request', e); return null; }
  }

  // Approve / reject (RLS enforces: same-station admin only).
  async function decide(id, status, note) {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient || !id) return false;
      if (status !== 'approved' && status !== 'rejected') return false;
      var me = await _me();
      var patch = {
        status: status,
        decided_by: me.id,
        decided_by_name: me.name,
        decision_note: note || null,
        decided_at: new Date().toISOString()
      };
      var res = await supabaseClient.from('document_approvals').update(patch).eq('id', id).select();
      if (res && res.error) { _log('approvals.decide', res.error); return false; }
      // RLS ne block kiya to data khali aayega — jhooti kamyabi na dikhayen
      if (!res || !res.data || !res.data.length) return false;
      try {
        if (DIO.audit) DIO.audit.log('document.approval_' + status, 'document',
          (res.data[0].document_key) || id, { metadata: { note: note || null } });
      } catch (_) {}
      return true;
    } catch (e) { _log('approvals.decide', e); return false; }
  }

  // Latest approval record for a given document.
  async function latestFor(docKey) {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient || !docKey) return null;
      var res = await supabaseClient.from('document_approvals')
        .select('*').eq('document_key', String(docKey))
        .order('requested_at', { ascending: false }).limit(1).maybeSingle();
      if (res && res.error) { _log('approvals.latestFor', res.error); return null; }
      return (res && res.data) || null;
    } catch (e) { _log('approvals.latestFor', e); return null; }
  }

  // Pending requests (station scoped by RLS anyway).
  async function pending() {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return [];
      var res = await supabaseClient.from('document_approvals')
        .select('*').eq('status', 'pending')
        .order('requested_at', { ascending: false }).limit(200);
      if (res && res.error) { _log('approvals.pending', res.error); return []; }
      return (res && res.data) || [];
    } catch (e) { _log('approvals.pending', e); return []; }
  }

  function _log(where, e) { if (DIO.errors) DIO.errors.silent(where, e); }

  DIO.approvals = {
    request: request,
    decide: decide,
    latestFor: latestFor,
    pending: pending,
    statusLabel: statusLabel,
    statusColor: statusColor,
    statusIcon: statusIcon,
    badge: badge,
    LABELS: LABELS
  };
})();
