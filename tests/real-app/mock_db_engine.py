"""v560 — دو آلات کی جانچ کا مشترک «سرور» (Python میں، تاکہ Playwright binding کے اندر کوئی اور API نہ
پکارنا پڑے — sync API میں وہ اٹک جاتا ہے)۔ اصل Postgres/PostgREST جیسا: sql/109 کا rev trigger (client کا
rev کبھی نہیں چلتا)، deleted_at، UUID شناخت، دوہری شناخت پر 23505، upsert onConflict، اور ہر تبدیلی پر
realtime واقعہ (supabase_realtime میں شامل جدولیں)۔"""
import copy, re, uuid, datetime, itertools

SYNC_T = {'cases', 'zimni_reports', 'zimni_androoni_reports', 'report_173', 'dio_user_data'}
PUB = SYNC_T
_seq = itertools.count()


def _now():
    t = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(milliseconds=next(_seq))
    return t.isoformat().replace('+00:00', 'Z')


def _s(v):
    """JS کے String(x) جیسا"""
    if v is None: return 'null'
    if v is True: return 'true'
    if v is False: return 'false'
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)


class DB:
    def __init__(self):
        self.t = {}
        self.events = []
        self.log = []          # (جدول، عمل، چھانٹی کے کالم، غلطی، قطاریں) — جانچ میں کون سا راستہ چلا
        # lost: سرور پر لکھا گیا مگر جواب راستے میں ٹوٹا (ایک بار) — آلہ اسے «انٹرنیٹ نہیں» سمجھتا ہے
        self.opts = {'fail': [], 'silent': [], 'lost': [], 'netfail': [], 'failCode': '42501', 'noTable': [], 'dateCols': {'zimni_reports': ['report_date']}}

    def table(self, name):
        return self.t.setdefault(name, [])

    def _hit(self, lst, t, op):
        return any(k == t + ':' + op or k == t + ':*' for k in (lst or []))

    def _match(self, st):
        fns = []
        for k, c, v in st.get('f') or []:
            if k == 'eq': fns.append(lambda x, c=c, v=v: _s(x.get(c)) == _s(v))
            elif k == 'neq': fns.append(lambda x, c=c, v=v: _s(x.get(c)) != _s(v))
            elif k == 'in': fns.append(lambda x, c=c, v=v: _s(x.get(c)) in [_s(i) for i in (v or [])])
            elif k == 'is': fns.append(lambda x, c=c, v=v: (x.get(c) is None) if v is None else x.get(c) == v)
            elif k == 'ilike':
                q = str(v).replace('%', '').lower()
                fns.append(lambda x, c=c, q=q: q in str(x.get(c) or '').lower())
        ors = []
        if st.get('orS'):
            toks, depth, cur = [], 0, ''
            for ch in st['orS']:
                if ch == '(': depth += 1
                if ch == ')': depth -= 1
                if ch == ',' and not depth: toks.append(cur); cur = ''
                else: cur += ch
            if cur: toks.append(cur)
            for tk in toks:
                m = re.match(r'^([a-z_]+)\.ilike\.(%?)(.*?)(%?)$', tk)
                if m: ors.append(lambda x, c=m.group(1), q=m.group(3).lower(): q in str(x.get(c) or '').lower()); continue
                m = re.match(r'^([a-z_]+)\.eq\.(.*)$', tk)
                if m: ors.append(lambda x, c=m.group(1), v=m.group(2): _s(x.get(c)) == v); continue
                m = re.match(r'^([a-z_]+)\.is\.null$', tk)
                if m: ors.append(lambda x, c=m.group(1): x.get(c) is None)
        return lambda x: all(f(x) for f in fns) and (not ors or any(f(x) for f in ors))

    def _defaults(self, t, r):
        o = dict(r)
        if o.get('id') is None: o['id'] = str(uuid.uuid4())
        if o.get('created_at') is None: o['created_at'] = _now()
        if t in SYNC_T:
            if o.get('rev') is None: o['rev'] = 1
            if o.get('updated_at') is None: o['updated_at'] = _now()
            o.setdefault('deleted_at', None)
        if t == 'dio_user_data' and o.get('officer_id') is None: o['officer_id'] = 'o1'
        return o

    def _ev(self, t, typ, new, old):
        if t in PUB: self.events.append({'table': t, 'eventType': typ, 'new': copy.deepcopy(new), 'old': old})

    def exec(self, st):
        t, op = st['t'], st.get('op', 'select')
        cols = [f[1] for f in (st.get('f') or [])]
        NET = {'data': None, 'error': {'message': 'TypeError: Failed to fetch', 'details': '', 'hint': '', 'code': ''}}
        # netfail: درخواست سرور تک پہنچی ہی نہیں (ایک بار) — 'جدول:عمل' یا 'جدول:عمل:پہلا_چھانٹی_کالم'
        for k in list(self.opts.get('netfail') or []):
            p = k.split(':')
            if p[0] == t and p[1] == op and (len(p) < 3 or (cols[:1] == [p[2]])):
                self.opts['netfail'].remove(k)
                self.log.append((t, op, cols, 'net-not-sent', 0))
                return NET
        res = self._exec(st)
        if op != 'select' and not res.get('error') and self._hit(self.opts.get('lost'), t, op):
            self.opts['lost'] = [k for k in self.opts['lost'] if k not in (t + ':' + op, t + ':*')]   # صرف ایک بار
            self.log.append((t, op, cols, 'net-reply-lost', len(res['data']) if isinstance(res.get('data'), list) else 1))
            return NET
        self.log.append((t, op, cols, None if res.get('error') is None else res['error'].get('code'),
                         len(res['data']) if isinstance(res.get('data'), list) else (1 if res.get('data') else 0)))
        return res

    def _exec(self, st):
        t, op = st['t'], st.get('op', 'select')
        one = bool(st.get('one'))

        def out(d):
            return {'data': (d[0] if d else None) if one else d, 'error': None, 'count': len(d)}

        if t in (self.opts.get('noTable') or []):
            return {'data': None, 'error': {'message': "Could not find the table 'public." + t + "' in the schema cache", 'code': 'PGRST205'}}
        rows_in = st.get('row')
        if op in ('insert', 'update', 'upsert') and rows_in is not None and t in self.opts['dateCols']:
            for r in (rows_in if isinstance(rows_in, list) else [rows_in]):
                for c in self.opts['dateCols'][t]:
                    v = r.get(c)
                    if v is None or re.match(r'^\d{4}-\d{2}-\d{2}', str(v)): continue
                    return {'data': None, 'error': {'message': 'invalid input syntax for type date: "%s"' % v, 'code': '22007'}}
        if op != 'select' and self._hit(self.opts['fail'], t, op):
            return {'data': None, 'error': {'message': 'new row violates row-level security policy for table "%s"' % t, 'code': self.opts['failCode']}}
        tb = self.table(t)
        m = self._match(st)
        rows = [x for x in tb if m(x)]
        if op == 'select':
            if st.get('ord'):
                c = st['ord']
                def key(x):
                    v = x.get(c)
                    try: return (0, float(str(v).split('/')[0]))
                    except Exception: return (1, str(v))
                rows = sorted(rows, key=key, reverse=(st.get('asc') is False))
            if st.get('lim'): rows = rows[:st['lim']]
            if one and len(rows) != 1 and not st.get('maybe'):
                return {'data': None, 'error': {'message': 'JSON object requested, multiple (or no) rows returned', 'code': 'PGRST116'}}
            if st.get('head'): return {'data': None, 'error': None, 'count': len(rows)}
            return out(copy.deepcopy(rows))
        if op in ('insert', 'upsert'):
            res = []
            for r0 in (rows_in if isinstance(rows_in, list) else [rows_in]):
                r = self._defaults(t, copy.deepcopy(r0))
                ex = next((x for x in tb if _s(x.get('id')) == _s(r['id'])), None)
                if op == 'upsert' and st.get('onConflict'):
                    cols = [c.strip() for c in st['onConflict'].split(',')]
                    ex = next((x for x in tb if all(_s(x.get(c)) == _s(r.get(c)) for c in cols)), None)
                if ex is not None and op == 'insert':
                    return {'data': None, 'error': {'message': 'duplicate key value violates unique constraint "%s_pkey"' % t, 'code': '23505'}}
                if ex is not None:
                    old_rev = ex.get('rev') or 1
                    patch = copy.deepcopy(r0); patch.pop('rev', None)
                    ex.update(patch)
                    if t in SYNC_T: ex['rev'] = old_rev + 1; ex['updated_at'] = _now()
                    res.append(copy.deepcopy(ex)); self._ev(t, 'UPDATE', ex, {'id': ex['id']})
                else:
                    if t == 'dio_user_data' and any(x.get('officer_id') == r.get('officer_id') and x.get('kind') == r.get('kind') and x.get('doc_key') == r.get('doc_key') for x in tb):
                        return {'data': None, 'error': {'message': 'duplicate key value violates unique constraint "dio_user_data_one_key"', 'code': '23505'}}
                    tb.append(r); res.append(copy.deepcopy(r)); self._ev(t, 'INSERT', r, {})
            return out(res)
        if op in ('update', 'delete') and self._hit(self.opts['silent'], t, op): return out([])
        if op == 'update':
            for r in rows:
                patch = copy.deepcopy(rows_in); patch.pop('rev', None)      # sql/109: client کا rev کبھی نہیں چلتا
                r.update(patch)
                if t in SYNC_T: r['rev'] = (r.get('rev') or 1) + 1; r['updated_at'] = _now()
                self._ev(t, 'UPDATE', r, {'id': r['id']})
            return out(copy.deepcopy(rows))
        if op == 'delete':
            self.t[t] = [x for x in tb if x not in rows]
            for r in rows: self._ev(t, 'DELETE', {}, {'id': r['id']})
            return out(copy.deepcopy(rows))
        return out([])

    def take_events(self):
        e, self.events = self.events, []
        return e
