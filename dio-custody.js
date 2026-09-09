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
    created:'➕', viewed:'👁️', printed:'🖨️', downloaded:'⬇️',
    deleted:'🗑️', modified:'✏️', transferred:'🔁'
  };

  async function _actor() {
    var o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
    var id = o.id || null;
    try {
      if (typeof getOfficerId === 'function') id = (await getOfficerId()) || id;
    } catch (_) {}
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
        DIO.errors.silent('custody.record', res.error);
      }
    } catch (e) {
      if (window.DIO && DIO.errors) DIO.errors.silent('custody.record', e);
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
      if (window.DIO && DIO.errors) DIO.errors.silent('custody.chain', e);
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
        var who = (ev.actor_name || 'نامعلوم') + (ev.actor_role ? ' — ' + ev.actor_role : '');
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
                (ev.station ? ' · ' + ev.station : '') + '</div>' +
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
