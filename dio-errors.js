/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — Error handling utility  (dio-errors.js)
   Audit "Remove #12" — 600+ silent `catch(_){}` blocks ki جگہ.

   Purani style:
     try { doThing(); } catch(_) {}                    // silent — audit ne mana kiya
     try { await db.foo(); } catch(_) { fallback(); }  // koi log nahi

   Nayi style (gradual adoption):
     DIO.errors.silent(() => doThing(), 'ctx.name');           // logged, no toast
     await DIO.errors.wrap(async () => await db.foo(), 'ctx'); // logged + user toast
     try { ... } catch(e) { DIO.errors.log(e, 'ctx.name'); }   // manual

   • Sensitive fields REDACT hoti hain (password, token, cnic, cell)
   • Console mein rich log (ctx + stack + timestamp)
   • Optional user toast (default silent for non-user-facing)
   • Telemetry hook — later Phase 4B (audit_logs) ke sath connect
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var DIO_ERR = {
    // In-memory ring buffer — recent 200 errors debugging ke liye
    _ring: [],
    _ringMax: 200,

    // Sensitive keys ki blacklist — log mein REDACT
    _sensitiveKeys: /pass(word)?|token|secret|api[_-]?key|cnic|cell|phone|mobile|email|auth/i,

    _redact: function (obj) {
      if (!obj || typeof obj !== 'object') return obj;
      var out = {};
      for (var k in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
        if (this._sensitiveKeys.test(k)) out[k] = '[REDACTED]';
        else out[k] = obj[k];
      }
      return out;
    },

    // Error message extractor — human readable
    userMessage: function (err) {
      if (!err) return 'نامعلوم مسئلہ';
      if (typeof err === 'string') return err.slice(0, 200);
      if (err.message) {
        // Common Supabase / PostgREST error refinements
        var m = String(err.message);
        if (/JWT|not authenticated|401/i.test(m)) return 'سیشن ختم ہو چکا — دوبارہ لاگ ان کریں';
        if (/network|failed to fetch/i.test(m))    return 'انٹرنیٹ کنکشن کا مسئلہ';
        if (/permission|denied|RLS|policy|403/i.test(m)) return 'اجازت نہیں';
        if (/duplicate key|already exists|23505/i.test(m)) return 'یہ اندراج پہلے سے موجود ہے';
        if (/not found|PGRST116/i.test(m))         return 'ریکارڈ نہیں ملا';
        if (/rate limit|too many/i.test(m))        return 'بہت جلد کوششیں — تھوڑی دیر بعد دوبارہ';
        return m.slice(0, 200);
      }
      return 'نامعلوم مسئلہ';
    },

    // Log method: sab jagah se yahin aati hain
    log: function (err, ctx, opts) {
      opts = opts || {};
      var entry = {
        ts: new Date().toISOString(),
        ctx: String(ctx || 'unknown').slice(0, 120),
        msg: err && err.message ? String(err.message).slice(0, 500) : String(err || '').slice(0, 500),
        code: (err && (err.code || err.status)) || null,
        stack: (err && err.stack) ? String(err.stack).slice(0, 1500) : null,
        extra: opts.extra ? this._redact(opts.extra) : null
      };
      // Ring buffer
      this._ring.push(entry);
      if (this._ring.length > this._ringMax) this._ring.shift();
      // Console — visible for debugging
      try {
        console.error('[DIO.err]', entry.ctx, '·', entry.msg, err);
      } catch (_) {}
      // User toast (opt-in)
      if (opts.toast && typeof showToast === 'function') {
        try { showToast('❌ ' + this.userMessage(err), 'error'); } catch (_) {}
      }
      // Telemetry hook (later Phase 4B — audit_logs)
      if (typeof window._dioTelemetry === 'function') {
        try { window._dioTelemetry(entry); } catch (_) {}
      }
      return entry;
    },

    // silent(fn, ctx, fallback) — replaces `try{fn()}catch(_){}` pattern
    // Ye NAI style hai: catch chhupta nahi, log hota hai.
    silent: function (fn, ctx, fallback) {
      try { return fn(); }
      catch (e) { this.log(e, ctx || 'silent'); return fallback; }
    },

    // silentAsync — same but for async fns
    silentAsync: async function (fn, ctx, fallback) {
      try { return await fn(); }
      catch (e) { this.log(e, ctx || 'silentAsync'); return fallback; }
    },

    // wrap(fn, ctx) — event handler wrapper. Toast user ko dikhata hai.
    wrap: function (fn, ctx) {
      var self = this;
      return function () {
        try {
          var r = fn.apply(this, arguments);
          if (r && typeof r.then === 'function') {
            return r.catch(function (e) { self.log(e, ctx, { toast: true }); });
          }
          return r;
        } catch (e) { self.log(e, ctx, { toast: true }); }
      };
    },

    // Recent errors — Console mein debug ke liye
    recent: function (n) { return this._ring.slice(-(n || 20)); },
    clear:  function () { this._ring = []; }
  };

  // Global unhandled error / promise rejection hooks
  window.addEventListener('error', function (e) {
    DIO_ERR.log(e.error || e.message, 'window.error', {
      extra: { file: e.filename, line: e.lineno, col: e.colno }
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    DIO_ERR.log(e.reason, 'unhandledrejection');
  });

  window.DIO = window.DIO || {};
  window.DIO.errors = DIO_ERR;
})();
