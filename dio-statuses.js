/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — Case Status Registry  (dio-statuses.js)
   Audit "Correct #3" — canonical status registry.

   Single source of truth for:
   • Machine code (DB mein stored value)
   • Urdu label (UI mein shown)
   • Pill class (rang)
   • Order (dashboard/reports mein consistent tarteeb)
   • isTerminal (final states — under mahz nahi)
   • Report 173 type se mapping
   • Allowed transitions (agli release mein enforce ho ga)

   Backward compat: purani STATUS_LABELS aur STATUS_CLASSES ab bhi
   kaam karti hain — ye nayi utility unke UPAR hai, unhें replace nahi
   karti.

   Usage:
     DIO.caseStatuses.label('complete')       → 'چالان مکمل'
     DIO.caseStatuses.pillClass('under')      → 'pill-blue'
     DIO.caseStatuses.all()                   → array of {code,label,pillClass,...}
     DIO.caseStatuses.fromR173Type('mukammal') → 'complete'
     DIO.caseStatuses.canTransition('under','complete') → true
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ── REGISTRY ────────────────────────────────────────────────
  // NOTE: DB codes STABLE hain — kabhi nahi badalne. Sirf label/color badle.
  var REGISTRY = {
    under: {
      code: 'under',
      label: 'زیر تفتیش',
      pillClass: 'pill-blue',
      color: '#3b82f6',
      order: 1,
      isTerminal: false,
      description: 'تفتیش جاری ہے'
    },
    incomplete: {
      code: 'incomplete',
      label: 'چالان نامکمل',
      pillClass: 'pill-amber',
      color: '#f59e0b',
      order: 2,
      isTerminal: false,
      description: 'چالان نامکمل صورت میں پیش کیا گیا'
    },
    challan512: {
      code: 'challan512',
      label: 'چالان 512',
      pillClass: 'pill-amber',
      color: '#f59e0b',
      order: 3,
      isTerminal: false,
      description: 'زیر دفعہ 512 ض ف چالان'
    },
    complete: {
      code: 'complete',
      label: 'چالان مکمل',
      pillClass: 'pill-green',
      color: '#22c55e',
      order: 4,
      isTerminal: true,
      description: 'چالان مکمل صورت میں پیش'
    },
    untrace: {
      code: 'untrace',
      label: 'عدم پتہ',
      pillClass: 'pill-purple',
      color: '#a855f7',
      order: 5,
      isTerminal: true,
      description: 'ملزم / سراغ نہ ملا'
    },
    cancel: {
      code: 'cancel',
      label: 'اخراج',
      pillClass: 'pill-red',
      color: '#ef4444',
      order: 6,
      isTerminal: true,
      description: 'مقدمہ اخراج (کینسل)'
    }
  };

  // ── Report 173 type → case status map ────────────────────────
  // (Report 173 jamma karne par case ki status change hoti hai)
  var R173_TYPE_TO_STATUS = {
    mukammal:       'complete',
    namukammal:     'incomplete',
    ch512:          'challan512',
    interim:        'under',
    ikhraj:         'cancel',
    adampata:       'untrace',
    tatima_challan: 'complete'
  };

  // ── Allowed transitions (agli release mein enforce ho gi) ────
  // Format: from → [allowed to states]
  // "Allowed" = commonly legitimate. Officer ye poori tarah tood sakta hai
  // agar shayad kabhi zarurat pade (allowedTransitions false pass karke).
  var TRANSITIONS = {
    under:      ['under','incomplete','complete','untrace','cancel','challan512'],
    incomplete: ['incomplete','complete','challan512','under','cancel'],
    challan512: ['challan512','complete','under','cancel'],
    complete:   ['complete'],           // TERMINAL — rarely reopen
    untrace:    ['untrace','under'],    // untrace → under (agar sراغ mila)
    cancel:     ['cancel','under']      // cancel → under (rarely re-opened)
  };

  // ── API ─────────────────────────────────────────────────────
  var DIO_STATUSES = {
    // Get metadata for one status
    meta: function (code) { return REGISTRY[code] || null; },

    // Urdu label
    label: function (code) {
      var m = REGISTRY[code];
      return m ? m.label : (code || '—');
    },

    // Pill CSS class (existing UI ka format)
    pillClass: function (code) {
      var m = REGISTRY[code];
      return m ? m.pillClass : 'pill-blue';
    },

    // HTML color hex
    color: function (code) {
      var m = REGISTRY[code];
      return m ? m.color : '#6b7280';
    },

    // Terminal check
    isTerminal: function (code) {
      var m = REGISTRY[code];
      return m ? !!m.isTerminal : false;
    },

    // Description (tooltip / help)
    describe: function (code) {
      var m = REGISTRY[code];
      return m ? m.description : '';
    },

    // Sab statuses — display order mein
    all: function () {
      var arr = [];
      for (var k in REGISTRY) if (REGISTRY.hasOwnProperty(k)) arr.push(REGISTRY[k]);
      arr.sort(function (a, b) { return a.order - b.order; });
      return arr;
    },

    // Filter dropdown ke <option> banao
    toOptions: function (currentValue) {
      return this.all().map(function (s) {
        var sel = (s.code === currentValue) ? ' selected' : '';
        return '<option value="' + s.code + '"' + sel + '>' + s.label + '</option>';
      }).join('');
    },

    // Report 173 type → case status
    fromR173Type: function (r173Type) {
      return R173_TYPE_TO_STATUS[r173Type] || null;
    },

    // Transition allowed hai?
    canTransition: function (from, to) {
      if (from === to) return true;                // no-op safe
      if (!REGISTRY[to]) return false;             // unknown target
      if (!from || !REGISTRY[from]) return true;   // no current state → any allowed
      var list = TRANSITIONS[from];
      if (!list) return true;                      // no rule → default allow
      return list.indexOf(to) !== -1;
    },

    // Sab valid DB codes ki list
    codes: function () {
      var arr = [];
      for (var k in REGISTRY) if (REGISTRY.hasOwnProperty(k)) arr.push(k);
      return arr;
    },

    // Validation: kya ye valid status hai?
    isValid: function (code) {
      return !!REGISTRY[code];
    }
  };

  // ── Global exposure ─────────────────────────────────────────
  window.DIO = window.DIO || {};
  window.DIO.caseStatuses = DIO_STATUSES;

  // ── Backward compat sync ───────────────────────────────────
  // Agar app-core.js ke STATUS_LABELS/CLASSES abhi tak load nahi hue
  // to yahan se seed kar dें. Agar pehle se hain to touch nahi karte
  // (idempotent).
  if (typeof window.STATUS_LABELS === 'undefined') {
    var LBLS = {}; for (var k1 in REGISTRY) LBLS[k1] = REGISTRY[k1].label;
    try { window.STATUS_LABELS = LBLS; } catch (_) {}
  }
  if (typeof window.STATUS_CLASSES === 'undefined') {
    var CLS = {}; for (var k2 in REGISTRY) CLS[k2] = REGISTRY[k2].pillClass;
    try { window.STATUS_CLASSES = CLS; } catch (_) {}
  }
})();
