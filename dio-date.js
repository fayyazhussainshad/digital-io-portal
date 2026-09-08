/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — Timezone Utility  (dio-date.js)
   Audit ka "Correct #9" — sab dates Asia/Karachi mein user ko dikhen,
   backend mein UTC rahें. Ek jagah utility — feature modules mein
   ad-hoc formatting band.

   Purani `formatDate()` (app-core.js) ab bhi kaam karti hai (backward
   compat). Nayi cheezें is DIO.date namespace se karें.

   Usage examples:
     DIO.date.fmt('2026-09-08T13:37:09Z', 'datetime')  → "08/09/2026 06:37 PM"
     DIO.date.fmt('2026-09-08', 'date')                → "08/09/2026"
     DIO.date.time('2026-09-08T13:37:09Z')             → "06:37 PM"
     DIO.date.rel('2026-09-05T10:00:00Z')              → "3 دن پہلے"
     DIO.date.today()                                  → "08/09/2026"
     DIO.date.nowIso()                                 → "2026-09-08T13:37:09.123Z"
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var TZ = 'Asia/Karachi';
  var DIO_DATE = {
    tz: TZ,

    // Safe Date parser — invalid ho to null lautao (crash na ho)
    _parse: function (v) {
      if (v === null || v === undefined || v === '') return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      var s = String(v).trim();
      if (!s) return null;
      // DD/MM/YYYY ya DD-MM-YYYY — Karachi local time as midnight
      var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (m) {
        var day = parseInt(m[1], 10), mon = parseInt(m[2], 10), yr = parseInt(m[3], 10);
        // Karachi is UTC+5 (no DST), midnight local = 19:00 previous day UTC
        var d = new Date(Date.UTC(yr, mon - 1, day, -5, 0, 0));
        return isNaN(d.getTime()) ? null : d;
      }
      var d2 = new Date(s);
      return isNaN(d2.getTime()) ? null : d2;
    },

    // Main formatter — style: 'date' | 'time' | 'datetime' | 'full'
    fmt: function (v, style) {
      var d = this._parse(v);
      if (!d) return '—';
      style = style || 'date';
      try {
        if (style === 'date') {
          return d.toLocaleDateString('en-GB', {
            timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'
          });
        }
        if (style === 'time') {
          return d.toLocaleTimeString('en-GB', {
            timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true
          }).toUpperCase();
        }
        if (style === 'datetime') {
          return d.toLocaleString('en-GB', {
            timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          }).toUpperCase();
        }
        if (style === 'full') {
          return d.toLocaleString('en-GB', {
            timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long',
            year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
          });
        }
        return d.toISOString();
      } catch (e) { return '—'; }
    },

    // Shortcuts
    date:     function (v) { return this.fmt(v, 'date'); },
    time:     function (v) { return this.fmt(v, 'time'); },
    datetime: function (v) { return this.fmt(v, 'datetime'); },

    // Aaj ki tarikh — Karachi timezone mein
    today: function () { return this.date(new Date()); },

    // Naya ISO timestamp (backend save ke liye — hamesha UTC)
    nowIso: function () { return new Date().toISOString(); },

    // "3 دن پہلے" / "آج" / "کل" — legal reminders/court ke liye
    rel: function (v) {
      var d = this._parse(v);
      if (!d) return '—';
      var now = new Date();
      // Compare in Karachi-local calendar days
      var opts = { timeZone: TZ };
      var todayStr = now.toLocaleDateString('en-CA', opts); // YYYY-MM-DD
      var dStr = d.toLocaleDateString('en-CA', opts);
      var diff = Math.round((new Date(dStr) - new Date(todayStr)) / (24*60*60*1000));
      if (diff === 0)  return 'آج';
      if (diff === -1) return 'کل (گزری)';
      if (diff === 1)  return 'کل (آنے والی)';
      if (diff < 0)    return Math.abs(diff) + ' دن پہلے';
      return diff + ' دن باقی';
    },

    // Kaghazi date input (YYYY-MM-DD ISO) → HTML <input type="date"> ke liye
    toInput: function (v) {
      var d = this._parse(v);
      if (!d) return '';
      // Karachi-local YYYY-MM-DD
      return d.toLocaleDateString('en-CA', { timeZone: TZ });
    },

    // Do dates ke darmiyan din
    daysBetween: function (a, b) {
      var da = this._parse(a), db = this._parse(b || new Date());
      if (!da || !db) return null;
      var opts = { timeZone: TZ };
      var aStr = da.toLocaleDateString('en-CA', opts);
      var bStr = db.toLocaleDateString('en-CA', opts);
      return Math.round((new Date(bStr) - new Date(aStr)) / (24*60*60*1000));
    }
  };

  // Global namespace: DIO
  window.DIO = window.DIO || {};
  window.DIO.date = DIO_DATE;

  // Convenience alias
  window.dioDate = DIO_DATE;
})();
