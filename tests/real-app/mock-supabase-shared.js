// v560 — @supabase/supabase-js کی آزمائشی نقل، مگر «سرور» مشترک: ہر query Playwright binding
// (window.__srv) سے ایک ہی server page (mock-db-engine.js) پر جاتی ہے۔ دو آلات = دو الگ browser
// context (الگ localStorage / IndexedDB) — ایک آلے کی تبدیلی دوسرے تک صرف سرور اور realtime سے۔
(function () {
  window.__opts = window.__opts || {};
  window.__rtSubs = [];
  window.__noSession = false;
  function mk(t) {
    const st = { t, op: 'select', f: [], one: false, maybe: false, orS: null, ord: null, asc: true, row: null, head: false, lim: 0, onConflict: null };
    const run = async () => {
      if (!navigator.onLine) throw new TypeError('Failed to fetch');
      const r = await window.__srv(st);
      return { data: r.data, error: r.error, count: r.count };
    };
    const p = new Proxy({}, {
      get(_, k) {
        // اصل supabase-js کی طرح: کسی نے builder کا طریقہ بدل دیا (مثلاً subscription.js کا لکھنے کا گارڈ) تو وہی چلے
        if (Object.prototype.hasOwnProperty.call(_, k)) return _[k];
        if (k === 'then') return (res, rej) => run().then(res, rej);
        if (k === 'select') return (_c, o) => { if (o && o.head) st.head = true; return p; };
        if (k === 'insert') return r => { st.op = 'insert'; st.row = r; return p; };
        if (k === 'upsert') return (r, o) => { st.op = 'upsert'; st.row = r; st.onConflict = (o && o.onConflict) || null; return p; };
        if (k === 'update') return r => { st.op = 'update'; st.row = r; return p; };
        if (k === 'delete') return () => { st.op = 'delete'; return p; };
        if (k === 'eq' || k === 'neq' || k === 'in' || k === 'is' || k === 'ilike') return (c, v) => { st.f.push([k, c, v]); return p; };
        if (k === 'or') return s => { st.orS = s; return p; };
        if (k === 'order') return (c, o) => { st.ord = c; st.asc = !(o && o.ascending === false); return p; };
        if (k === 'limit') return n => { st.lim = n; return p; };
        if (k === 'single') return () => { st.one = true; return p; };
        if (k === 'maybeSingle') return () => { st.one = true; st.maybe = true; return p; };
        return () => p;
      }
    });
    return p;
  }
  // realtime: سرور کی تبدیلیاں Python سے یہاں آتی ہیں
  window.__rtDeliver = function (evts) {
    (evts || []).forEach(e => {
      window.__rtSubs.forEach(s => {
        if (s.dead) return;
        if (s.filter.table && s.filter.table !== e.table) return;
        if (s.filter.event && s.filter.event !== '*' && s.filter.event !== e.eventType) return;
        try { s.cb({ eventType: e.eventType, new: e.new, old: e.old, table: e.table, schema: 'public' }); } catch (err) { console.error('rt cb', err); }
      });
    });
    return true;
  };
  function channel(name) {
    const subs = [];
    const ch = {
      on(type, filter, cb) { if (type === 'postgres_changes') subs.push({ filter: filter || {}, cb }); return ch; },
      subscribe(cb) { subs.forEach(s => window.__rtSubs.push(s)); ch._subs = subs; setTimeout(() => { try { cb && cb('SUBSCRIBED'); } catch (_) { /* کچھ نہیں */ } }, 50); return ch; },
      unsubscribe() { subs.forEach(s => { s.dead = true; }); }
    };
    return ch;
  }
  const session = { user: { id: 'u1', email: 'io@test.pk', user_metadata: {} }, access_token: 'x', refresh_token: 'y' };
  const client = {
    from: mk,
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: window.__noSession ? null : session }, error: null }),
      getUser: async () => ({ data: { user: session.user }, error: null }),
      refreshSession: async () => ({ data: { session: window.__noSession ? null : session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }), startAutoRefresh() {}, stopAutoRefresh() {},
      signInWithPassword: async () => ({ data: { session, user: session.user }, error: null }),
    },
    storage: { from: () => ({ upload: async () => ({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }),
      createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }), remove: async () => ({ data: null, error: null }) }) },
    channel, removeChannel(ch) { try { ch && ch.unsubscribe && ch.unsubscribe(); } catch (_) { /* کچھ نہیں */ } },
    functions: { invoke: async () => ({ data: null, error: null }) },
  };
  window.supabase = { createClient: () => client };
})();
