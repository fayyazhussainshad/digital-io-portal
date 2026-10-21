// Test double for @supabase/supabase-js UMD — the REAL app runs on top of it.
(function () {
    window.__opts = { noUpdatePolicy: false, fail: [], silent: [], failCode: '42501', noTable: [],
      // v552: اصل Postgres کی طرح تاریخ کا کالم — 'YYYY-MM-DD' مانتا ہے؛ '14/10/2026' (DD/MM) رد
      //   (DateStyle MDY: پہلا حصہ مہینہ ہوتا ہے، 12 سے اوپر → 22008)
      dateCols: { zimni_reports: ['report_date'] },
      // v552: اصل PostgREST کی طرح نامعلوم کالم پر PGRST204 (صرف ان جدولوں پر جن کا ڈھانچہ یہاں درج ہے)
      schema: { zimni_reports: ['id', 'case_id', 'serial_no', 'report_date', 'officer_id', 'content', 'created_at', 'updated_at'] },
      authFail: '' };   // 'net' = سرور تک رسائی نہیں · 'cred' = غلط ای میل/پاس ورڈ
  // v547: ناکامی کی نقل — اصل Supabase کی طرح غلطی پھینکی نہیں جاتی، {error} لوٹتا ہے۔
  //   __opts.fail   = ['recycle_bin:insert', …]  → سرور کا رد (RLS 42501)
  //   __opts.silent = ['reminders:delete', …]   → RLS کی خاموش روک: کوئی غلطی نہیں، 0 قطار
  const _hit = (list, t, op) => (list || []).some(k => k === t + ':' + op || k === t + ':*');
  window.__db = window.__db || {
    officers: [{ id: 'o1', user_id: 'u1', email: 'io@test.pk', full_name: 'فیاض حسین شاد', designation: 'ASI', badge_number: '1234',
      station: 'صدر ملتان', district: 'ملتان', role: 'officer', is_approved: true, suspended: false, created_at: '2026-01-01T00:00:00Z' }],
    subscriptions: [{ id: 's1', officer_id: 'o1', status: 'active', start_date: '2026-01-01', end_date: '2027-12-31', expires_at: '2027-12-31T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z', subscription_plans: { name: 'سالانہ', duration_days: 365 } }],
    incident_reports: [], recycle_bin: [], cases: [{ id: 'c1', officer_id: 'o1', fir_number: '1234/26', offence_type: 'چوری',
      section_of_law: '380 ت پ', occurrence_date: '2026-10-08', occurrence_place: 'وقاص ٹاؤن ملتان', status: 'under',
      complainant: 'ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان', created_at: '2026-10-08T00:00:00Z' }],
    case_accused: [{ id: 'a1', case_id: 'c1', name: 'نامعلوم ملزم', accused_type: 'fir', created_at: '2026-10-08' }],
  };
  let seq = 0;
  function mk(t) {
    const st = { t, op: 'select', f: [], one: false, orS: null, ord: null, row: null, head: false };
    const run = () => {
      if (!navigator.onLine) throw new TypeError('Failed to fetch');
      // sql چلنے سے پہلے: table ہی نہیں (اصل PostgREST کا جواب)
      if ((window.__opts.noTable || []).includes(st.t))
        return { data: null, error: { message: "Could not find the table 'public." + st.t + "' in the schema cache", code: 'PGRST205' } };
      if ((st.op === 'insert' || st.op === 'update' || st.op === 'upsert') && st.row && (window.__opts.schema || {})[st.t]) {
        const cols = window.__opts.schema[st.t];
        for (const r of (Array.isArray(st.row) ? st.row : [st.row])) {
          const bad = Object.keys(r).find(k => cols.indexOf(k) === -1);
          if (bad) return { data: null, error: { message: "Could not find the '" + bad + "' column of '" + st.t + "' in the schema cache", code: 'PGRST204' } };
        }
      }
      if ((st.op === 'insert' || st.op === 'update' || st.op === 'upsert') && st.row && (window.__opts.dateCols || {})[st.t]) {
        for (const r of (Array.isArray(st.row) ? st.row : [st.row])) {
          for (const c of window.__opts.dateCols[st.t]) {
            const v = r[c];
            if (v == null || /^\d{4}-\d{2}-\d{2}/.test(String(v))) continue;
            const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (!m) return { data: null, error: { message: 'invalid input syntax for type date: "' + v + '"', code: '22007' } };
            if (+m[1] > 12) return { data: null, error: { message: 'date/time field value out of range: "' + v + '"', code: '22008', hint: 'Perhaps you need a different "datestyle" setting.' } };
          }
        }
      }
      if (st.op !== 'select' && _hit(window.__opts.fail, st.t, st.op))
        return { data: null, error: window.__opts.failCode === '42501'
          ? { message: 'new row violates row-level security policy for table "' + st.t + '"', code: '42501' }
          : { message: 'canceling statement due to statement timeout', code: String(window.__opts.failCode) } };
      const tb = window.__db[st.t] || (window.__db[st.t] = []);
      let rows = tb.filter(x => st.f.every(fn => fn(x)));
      if (st.orS) {
        // PostgREST «or»: col.ilike.%x% · col.ilike.x% · col.in.(a,b) · col.eq.v
        const toks = []; let depth = 0, cur = '';
        for (const ch of st.orS) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { toks.push(cur); cur = ''; } else cur += ch; }
        if (cur) toks.push(cur);
        const tests = toks.map(t => {
          let m = t.match(/^([a-z_]+)\.ilike\.(%?)(.*?)(%?)$/);
          if (m) { const q = m[3].toLowerCase(), pre = !m[2], suf = !!m[4];
            return x => { const v = String(x[m[1]] || '').toLowerCase(); return pre && suf ? v.startsWith(q) : (!pre && suf) ? v.includes(q) : v === q; }; }
          m = t.match(/^([a-z_]+)\.in\.\((.*)\)$/);
          if (m) { const vs = m[2].split(','); return x => vs.includes(String(x[m[1]] == null ? '' : x[m[1]])); }
          m = t.match(/^([a-z_]+)\.eq\.(.*)$/);
          if (m) return x => String(x[m[1]]) === m[2];
          m = t.match(/^([a-z_]+)\.is\.null$/);
          if (m) return x => x[m[1]] == null;
          return null;
        }).filter(Boolean);
        if (tests.length) rows = rows.filter(x => tests.some(fn => fn(x)));
      }
      const out = d => ({ data: st.one ? (d[0] || null) : d, error: null, count: d.length });
      if (st.op === 'select') {
        if (st.ord) rows.sort((a, b) => String(b[st.ord]).localeCompare(String(a[st.ord])));
        return st.head ? { data: null, error: null, count: rows.length } : out(JSON.parse(JSON.stringify(rows)));
      }
      if (st.op === 'insert' || st.op === 'upsert') {
        const list = (Array.isArray(st.row) ? st.row : [st.row]).map(r => ({ id: 'r' + (++seq), created_at: new Date(Date.now() + seq).toISOString(), ...JSON.parse(JSON.stringify(r)) }));
        list.forEach(r => tb.push(r));
        return out(list);
      }
      if ((st.op === 'update' || st.op === 'delete') && _hit(window.__opts.silent, st.t, st.op)) return out([]);
      if (st.op === 'update') {
        if (st.t === 'incident_reports' && window.__opts.noUpdatePolicy) return out([]);
        rows.forEach(r => Object.assign(r, JSON.parse(JSON.stringify(st.row))));
        return out(rows);
      }
      // اصل PostgREST: delete(...).select() حذف شدہ قطاریں لوٹاتا ہے
      if (st.op === 'delete') { window.__db[st.t] = tb.filter(x => !rows.includes(x)); return out(JSON.parse(JSON.stringify(rows))); }
      return out([]);
    };
    const p = new Proxy({}, {
      get(_, k) {
        if (k === 'then') return (res, rej) => Promise.resolve().then(run).then(res, rej);
        if (k === 'select') return (_c, o) => { if (o && o.head) st.head = true; return p; };
        if (k === 'insert' || k === 'upsert') return r => { st.op = k; st.row = r; return p; };
        if (k === 'update') return r => { st.op = 'update'; st.row = r; return p; };
        if (k === 'delete') return () => { st.op = 'delete'; return p; };
        if (k === 'eq') return (c, v) => { st.f.push(x => String(x[c]) === String(v)); return p; };
        if (k === 'in') return (c, v) => { st.f.push(x => (v || []).map(String).includes(String(x[c]))); return p; };
        if (k === 'ilike') return (c, w) => { const q = String(w).replace(/%/g, '').toLowerCase(); st.f.push(x => String(x[c] || '').toLowerCase().includes(q)); return p; };
        if (k === 'neq') return (c, v) => { st.f.push(x => String(x[c]) !== String(v)); return p; };
        if (k === 'is') return (c, v) => { st.f.push(x => (v === null ? x[c] == null : x[c] === v)); return p; };
        if (k === 'or') return s => { st.orS = s; return p; };
        if (k === 'order') return c => { st.ord = c; return p; };
        if (k === 'maybeSingle' || k === 'single') return () => { st.one = true; return p; };
        return () => p;   // neq, gte, lte, is, not, range, limit, match …
      }
    });
    return p;
  }
  const session = { user: { id: 'u1', email: 'io@test.pk', user_metadata: {} }, access_token: 'x', refresh_token: 'y' };
  const anyChain = () => new Proxy(function () {}, { get: (_, k) => k === 'then' ? undefined : anyChain(), apply: () => anyChain() });
  const client = {
    from: mk,
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session.user }, error: null }),
      refreshSession: async () => (window.__opts.authFail === 'net'
        ? { data: { session: null, user: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 } }
        : { data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }), startAutoRefresh() {}, stopAutoRefresh() {},
      signInWithPassword: async () => {
        if (window.__opts.authFail === 'net') return { data: { user: null, session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 } };
        if (window.__opts.authFail === 'cred') return { data: { user: null, session: null }, error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' } };
        return { data: { session, user: session.user }, error: null };
      },
    },
    storage: { from: () => ({ upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }),
      createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }), remove: async () => ({ data: null, error: null }) }) },
    channel: () => anyChain(), removeChannel() {}, functions: { invoke: async () => ({ data: null, error: null }) },
  };
  window.supabase = { createClient: () => client };
})();
