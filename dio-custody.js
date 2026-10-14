/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — CHAIN OF CUSTODY helper  (dio-custody.js)
   Phase 4C

   DIO.custody.record(eventType, evidenceId, opts)
       — logs one custody event (created|viewed|printed|downloaded|
         deleted|modified|transferred). Silent-fail, never throws,
         never blocks the UI.
   DIO.custody.chain(evidenceId)  — returns the ordered event list.
   DIO.custody.label(type)        — Urdu label for an event type.

   Table: evidence_custody_events (see evidence_custody_events.sql).
   Records are INSERT-only and survive evidence deletion — this is the
   court-presentable proof of who touched a piece of evidence and when.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  window.DIO = window.DIO || {};
  if (DIO.custody) return;

  var LABELS = {
    created:    'درج کی گئی',
    viewed:     'دیکھی گئی',
    printed:    'پرنٹ کی گئی',
    downloaded: 'ڈاؤن لوڈ کی گئی',
    deleted:    'حذف کی گئی',
    modified:   'ترمیم کی گئی',
    transferred:'منتقل کی گئی'
  };
  var ICONS = {
    created:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 5v14"/><path d="M5 12h14"/></svg>', viewed:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>', printed:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M7 9.5V3.5h10v6"/><path d="M4.5 9.5h15v7h-15z"/><path d="M7 13.5h10V21H7z"/></svg>', downloaded:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/></svg>',
    deleted:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg>', modified:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>', transferred:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M4 8h12a4 4 0 0 1 0 8H8"/><path d="M7 5L4 8l3 3"/></svg>'
  };

  async function _actor() {
    var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    var id = o.id || null;
    try {
      if (typeof getOfficerId === 'function') id = (await getOfficerId()) || id;
    } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    return {
      id: id,
      name: o.full_name || '',
      role: o.role || o.designation || '',
      station: o.station || ''
    };
  }

  // Log one event. Returns a promise that always resolves (never rejects).
  async function record(eventType, evidenceId, opts) {
    opts = opts || {};
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
      var a = await _actor();
      if (!a.id) return; // no authenticated actor → nothing to attribute
      var row = {
        evidence_id:   evidenceId || null,
        fir_number:    opts.fir_number || null,
        evidence_name: opts.evidence_name || null,
        event_type:    eventType,
        actor_id:      a.id,
        actor_name:    a.name,
        actor_role:    a.role,
        station:       a.station,
        details:       opts.details || {}
      };
      var res = await supabaseClient.from('evidence_custody_events').insert(row);
      if (res && res.error && window.DIO && DIO.errors) {
        DIO.errors.log(res.error, 'custody.record');
      }
    } catch (e) {
      if (window.DIO && DIO.errors) DIO.errors.log(e, 'custody.record');
    }
  }

  // Fetch the full ordered chain for one evidence item.
  async function chain(evidenceId) {
    try {
      if (typeof supabaseClient === 'undefined' || !supabaseClient || !evidenceId) return [];
      var r = await supabaseClient
        .from('evidence_custody_events')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: true });
      return (r && r.data) || [];
    } catch (e) {
      if (window.DIO && DIO.errors) DIO.errors.log(e, 'custody.chain');
      return [];
    }
  }

  function label(t) { return LABELS[t] || t; }
  function icon(t)  { return ICONS[t]  || '•'; }

  // Render the chain as a small vertical timeline (RTL). Returns HTML.
  function renderChain(events) {
    if (!events || !events.length) {
      return '<div style="font-size:11px;color:var(--text-muted);padding:8px 0;">ابھی کوئی حفاظتی ریکارڈ نہیں</div>';
    }
    var fmt = (window.DIO && DIO.date)
      ? function (d) { return DIO.date.datetime(d); }
      : function (d) { try { return new Date(d).toLocaleString(); } catch (_) { return d || ''; } };
    return '<div style="display:flex;flex-direction:column;gap:0;direction:rtl;">' +
      events.map(function (ev, i) {
        var last = i === events.length - 1;
        var _ce = (window.esc || function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});});
        var who = _ce(ev.actor_name || 'نامعلوم') + (ev.actor_role ? ' — ' + _ce(ev.actor_role) : '');
        return '' +
          '<div style="display:flex;gap:8px;align-items:flex-start;">' +
            '<div style="display:flex;flex-direction:column;align-items:center;">' +
              '<div style="font-size:13px;line-height:1;">' + icon(ev.event_type) + '</div>' +
              (last ? '' : '<div style="width:2px;flex:1;min-height:18px;background:var(--border);margin:2px 0;"></div>') +
            '</div>' +
            '<div style="padding-bottom:' + (last ? '0' : '10px') + ';">' +
              '<div style="font-size:12px;font-weight:700;">' + label(ev.event_type) + '</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">' + who + '</div>' +
              '<div style="font-size:10px;color:var(--text-faint);">' + fmt(ev.created_at) +
                (ev.station ? ' · ' + _ce(ev.station) : '') + '</div>' +
            '</div>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  DIO.custody = {
    record: record,
    chain: chain,
    label: label,
    icon: icon,
    renderChain: renderChain,
    LABELS: LABELS
  };
})();
