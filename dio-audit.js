/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — Audit logging  (dio-audit.js)  — Phase 4B (Add #1)

   Sensitive actions ka immutable trail. audit_logs table mein likhta hai.

   Usage:
     DIO.audit.log('share.granted', 'case_share', shareId, {
       case_id: caseId,
       after: { permission, expires_at },
       metadata: { officer_name: recipientName }
     });

     DIO.audit.log('case.status_changed', 'case', caseId, {
       case_id: caseId,
       before: { status: 'under' },
       after:  { status: 'complete' }
     });

     await DIO.audit.recent(20);  // apni recent actions

   Rules:
   • Silent failure — audit likhne mein masla ho to main action nahi tootta
   • Sensitive fields REDACT hoti hain (password/token/cnic/cell/phone/email)
   • Batching — quick actions kaafi jaldi ho to buffer + flush (foran DB hit nahi)
   • Immutable — user apni actions edit/delete nahi kar sakta (SQL RLS)
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var BATCH_MS = 800;        // 800ms tak buffer, phir flush
  var BATCH_MAX = 20;        // ya 20 entries — jo pehle aa jaye

  var DIO_AUDIT = {
    _queue: [],
    _timer: null,
    _sensitiveKeys: /pass(word)?|token|secret|api[_-]?key|cnic|cell|phone|mobile|email|auth/i,
    _availableCheckDone: false,
    _available: true,

    // ── Redaction (DIO.errors._redact jaisa pattern) ──
    _redact: function (obj) {
      if (obj == null) return obj;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(this._redact.bind(this));
      var out = {};
      for (var k in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
        if (this._sensitiveKeys.test(k)) out[k] = '[REDACTED]';
        else if (obj[k] && typeof obj[k] === 'object') out[k] = this._redact(obj[k]);
        else out[k] = obj[k];
      }
      return out;
    },

    // ── Main log method ──
    // action: string like 'case.created', 'share.granted'
    // entity_type: 'case', 'case_share', 'case_document', etc.
    // entity_id: uuid or null
    // opts: { case_id, before, after, metadata, request_id }
    log: function (action, entity_type, entity_id, opts) {
      opts = opts || {};
      var entry = {
        _pending_actor: true,  // marker — actor_id fill karें ge flush ke waqt
        action: String(action || 'unknown').slice(0, 100),
        entity_type: entity_type ? String(entity_type).slice(0, 60) : null,
        entity_id: entity_id || null,
        case_id: opts.case_id || null,
        before_data: opts.before ? this._redact(opts.before) : null,
        after_data:  opts.after  ? this._redact(opts.after)  : null,
        metadata:    opts.metadata ? this._redact(opts.metadata) : null,
        request_id:  opts.request_id || null
      };
      this._queue.push(entry);
      this._schedule();
      // In-memory bhi rakhें (DIO.errors ki tarah — recent debugging ke liye)
      try {
        if (window.DIO && DIO.errors && typeof console !== 'undefined') {
          console.debug('[DIO.audit]', entry.action, entry);
        }
      } catch (_) {}
      // Overflow — foran flush
      if (this._queue.length >= BATCH_MAX) this._flush();
      return entry;
    },

    _schedule: function () {
      var self = this;
      if (this._timer) return;
      this._timer = setTimeout(function () {
        self._timer = null;
        self._flush();
      }, BATCH_MS);
    },

    _flush: async function () {
      if (!this._queue.length) return;
      var batch = this._queue.splice(0);
      // supabaseClient available?
      if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        // Sync — no client, drop silently but stash in DIO.errors for debug
        try { if (window.DIO && DIO.errors) DIO.errors.log(new Error('no supabaseClient'), 'audit.flush', { extra: { dropped: batch.length } }); } catch (_) {}
        return;
      }
      // actor_id resolve — currentOfficer se
      var actor_id = null, actor_role = null;
      try {
        if (typeof currentOfficer !== 'undefined' && currentOfficer) {
          actor_id = currentOfficer.id || null;
          actor_role = currentOfficer.role || currentOfficer.designation || null;
        }
      } catch (_) {}
      if (!actor_id) {
        try {
          if (typeof getOfficerId === 'function') actor_id = await getOfficerId();
        } catch (_) {}
      }
      // Prepare rows
      var rows = batch.map(function (e) {
        return {
          actor_id: actor_id,
          actor_role: actor_role,
          action: e.action,
          entity_type: e.entity_type,
          entity_id: e.entity_id,
          case_id: e.case_id,
          before_data: e.before_data,
          after_data: e.after_data,
          metadata: e.metadata,
          request_id: e.request_id
        };
      });
      // Write — SILENT failure (main action nahi tootni chahiye)
      try {
        var res = await supabaseClient.from('audit_logs').insert(rows);
        if (res && res.error) throw res.error;
      } catch (e) {
        // Table na ho ya RLS block ho — quiet log for dev only
        try {
          if (window.DIO && DIO.errors) DIO.errors.log(e, 'audit.write', { extra: { rows: rows.length } });
        } catch (_) {}
        // Ek dafa fail ho to yaad rakhें ke shayad table ready nahi
        if (e && /audit_logs|does not exist|relation/i.test(e.message || '')) {
          this._available = false;
        }
      }
    },

    // Foran flush (page unload / logout time)
    flush: async function () {
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      await this._flush();
    },

    // Recent actions — apna trail dekhne ke liye
    recent: async function (n) {
      n = n || 20;
      try {
        var actor_id = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer.id : null;
        if (!actor_id && typeof getOfficerId === 'function') actor_id = await getOfficerId();
        if (!actor_id) return [];
        var res = await supabaseClient.from('audit_logs')
          .select('*').eq('actor_id', actor_id)
          .order('created_at', { ascending: false }).limit(n);
        return (res && res.data) || [];
      } catch (e) {
        if (window.DIO && DIO.errors) DIO.errors.log(e, 'audit.recent');
        return [];
      }
    },

    // Table available check (aage UI hide karne ke liye)
    isAvailable: function () { return this._available; }
  };

  // Page unload par pending audit flush
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', function () {
      try { DIO_AUDIT.flush(); } catch (_) {}
    });
  }

  window.DIO = window.DIO || {};
  window.DIO.audit = DIO_AUDIT;
})();
