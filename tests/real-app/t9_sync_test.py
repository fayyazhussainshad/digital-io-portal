"""(v572، TASK 9) دو آلات ایک ساتھ (لیپ ٹاپ 1366×768 + موبائل 390×844 touch)، ایک سرور (mock_db_engine.py):
چالان — لیپ ٹاپ پر 2 ملزم (1۔ 2۔) + لمبے «مختصر حالات» → محفوظ → موبائل پر کھولا: نمبر، ہر لفظ الگ، کاغذ کے کالم
وہی → موبائل پر ایک ملزم مٹایا (نمبر خود ہٹا) → محفوظ → لیپ ٹاپ reload → وہی تبدیلی، کوئی لفظ نہیں جُڑا۔
چلانا: `python3 t9_sync_test.py`
"""
import os, sys, json, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, BASE, OUT
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'      # مقدمہ 681/26
V = OUT + '/t9/sync/'
os.makedirs(V, exist_ok=True)

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:300] if extra != '' else ''), flush=True)

def seed(S):
    t = '2026-10-08T00:00:00Z'
    S.t['officers'] = [{'id': 'o1', 'user_id': 'u1', 'email': 'io@test.pk', 'full_name': 'فیاض حسین شاد', 'designation': 'ASI', 'badge_number': '1234',
        'station': 'صدر ملتان', 'district': 'ملتان', 'role': 'officer', 'is_approved': True, 'suspended': False, 'created_at': '2026-01-01T00:00:00Z'}]
    S.t['subscriptions'] = [{'id': 's1', 'officer_id': 'o1', 'status': 'active', 'start_date': '2026-01-01', 'end_date': '2027-12-31', 'expires_at': '2027-12-31T00:00:00Z',
        'created_at': '2026-01-01T00:00:00Z', 'subscription_plans': {'name': 'سالانہ', 'duration_days': 365}}]
    S.t['cases'] = [{'id': CA, 'officer_id': 'o1', 'fir_number': '681/26', 'section_of_law': '380 ت پ', 'occurrence_date': '2026-10-08', 'occurrence_place': 'وقاص ٹاؤن ملتان',
        'status': 'under', 'complainant': 'ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None}]
    S.t['case_accused'] = [{'id': 'a1', 'case_id': CA, 'name': 'محمد عرفان ولد محمد یوسف قوم آرائیں سکنہ بستی ملوک ملتان', 'cnic': '3630212345671', 'accused_type': 'fir', 'created_at': '2026-10-08'},
                           {'id': 'a2', 'case_id': CA, 'name': 'شاہد علی ولد غلام نبی قوم جٹ سکنہ چک 5 فیض ملتان', 'cnic': '3630276543211', 'accused_type': 'fir', 'created_at': '2026-10-09'}]
    for k in ('zimni_reports', 'zimni_androoni_reports', 'report_173', 'dio_user_data', 'recycle_bin', 'incident_reports', 'case_witnesses'): S.t[k] = []
    S.t['fir_matn'] = [{'id': 'm1', 'case_id': CA, 'type': 'fir', 'matn': 'میں مدعی مقدمہ ہوں۔', 'created_at': '2026-10-01'}]


HALAAT = '#ch173-doc [data-k="halaat"]'
sys.path.insert(0, HERE)
from v564_common import PARA
WORDS = ((' '.join(PARA) + ' ') * 3).split()[:360]
BOILER = 'جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ جس پر مقدمہ عنوان بالا درج ہوا تفتیش مقدمہ عمل میں لائی گئی دورانِ تفتیش'.split()
BOTH = """() => { const g = k => { const e = document.querySelector('#ch173-doc [data-k="' + k + '"]'); return e ? e.textContent : ''; };
  return g('halaat') + ' ' + g('cont_text'); }"""
ZH = "() => { const e = document.querySelector('#ch173-doc [data-k=\"zer_hirasat\"]'); return e ? e.innerText.replace(/\\n+$/, '') : null; }"
COLS = "() => [...document.querySelectorAll('#ch173-table colgroup col')].map(c => Math.round(parseFloat(c.style.width) || 0))"
VOC = set(WORDS) | set(BOILER)


def toks(s):
    return [t for t in re.split(r'\s+', s or '') if t]


def names(t):
    return [x for x in (t or '').split('\n') if x.strip() and not re.match(r'^\s*[\d-]+\s*$', x)]


with sync_playwright() as p:
    b = p.chromium.launch()
    S = DB(); seed(S)
    devices = []

    def srv_exec(source, st):
        return S.exec(st)

    def pump():
        evts = S.take_events()
        if not evts: return
        for d in list(devices):
            try: d['pg'].evaluate('e => window.__rtDeliver ? __rtDeliver(e) : 0', evts)
            except Exception: pass

    def idle(pg, ms):
        end = time.time() + ms / 1000.0
        while True:
            pump()
            left = end - time.time()
            if left <= 0: break
            pg.wait_for_timeout(min(150, int(left * 1000) + 1))
        pump()

    def db(table):
        return json.loads(json.dumps(S.t.get(table, [])))

    def route(r):
        u = r.request.url
        if 'supabase' in u and u.endswith('.js'):
            return r.fulfill(path=SHARED, content_type='application/javascript')
        return real_route(r)

    def login(pg):
        pg.goto(BASE + 'index.html'); idle(pg, 2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        idle(pg, 2500)
        pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
        idle(pg, 300)

    def device(label, **ctxargs):
        ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', **ctxargs)
        ctx.route('**/*', route)
        ctx.expose_binding('__srv', srv_exec)
        ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));"
                            + "\nwindow.confirm = () => true;")
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        login(pg)
        d = {'label': label, 'ctx': ctx, 'pg': pg, 'errs': errs}
        devices.append(d)
        return d

    def relogin(pg):
        pg.reload(); idle(pg, 2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        idle(pg, 2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); idle(pg, 300)

    def put(pg, sel, txt, replace=False):
        pg.evaluate("""([s, t, rep]) => { const h = document.querySelector(s); h.focus(); const r = document.createRange(); r.selectNodeContents(h);
            if (!rep) r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, t); return 0; }""", [sel, txt, replace])
        idle(pg, 500)

    def open_challan(pg, rid):
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("async (id) => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); await _r173OpenDoc(String(id)); return 0; }", rid)
        idle(pg, 2800)

    D = device('desktop', viewport={'width': 1366, 'height': 768})
    M = device('mobile', viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2,
               user_agent='Mozilla/5.0 (Linux; Android 14; SM-A156E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36')
    dp, mp = D['pg'], M['pg']

    # ═══ 1) لیپ ٹاپ: 2 ملزم + لمبا متن → محفوظ ═══
    dp.evaluate("c => openCaseWorkspace(c)", CA); idle(dp, 1300)
    dp.evaluate("openReport173WithType('mukammal')"); idle(dp, 2800)
    dp.evaluate("""() => { document.querySelector('#ch173-table button.acc-pick[onclick*="zer_hirasat"]').click(); return 0; }"""); idle(dp, 400)
    dp.evaluate("""() => { const box = document.getElementById('ch173-acc-menu'); box.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = true); box.querySelector('#ch173-acc-ok').click(); return 0; }""")
    idle(dp, 1200)
    pre = toks(dp.evaluate(BOTH))            # خانے کا پہلے سے بھرا متن (FIR کا متن بھی) — وہ بھی لفظ بہ لفظ
    VOC.update(pre)
    put(dp, HALAAT, ' ' + ' '.join(WORDS))
    idle(dp, 1200)
    exp = len(pre) + len(WORDS)
    t0 = toks(dp.evaluate(BOTH))
    check('لیپ ٹاپ: لکھنے کے بعد ہر لفظ الگ', len(t0) == exp and all(t in VOC for t in t0), (len(t0), exp))
    z0 = names(dp.evaluate(ZH))
    check('لیپ ٹاپ: دو ملزم → 1۔ 2۔', len(z0) == 2 and z0[0].startswith('1۔') and z0[1].startswith('2۔'), z0)
    dcols = dp.evaluate(COLS)
    dp.evaluate("_saveR173()"); idle(dp, 2200)
    rows = db('report_173')
    RID = rows[0]['id'] if rows else None
    check('سرور: چالان محفوظ (ایک قطار)', len(rows) == 1 and RID, len(rows))


    # ═══ 2) موبائل: کھولو → نمبر، الفاظ، کالم ═══
    open_challan(mp, RID)
    z1 = names(mp.evaluate(ZH)); t1 = toks(mp.evaluate(BOTH)); mcols = mp.evaluate(COLS)
    check('موبائل: وہی دو ملزم، 1۔ 2۔', z1 == z0, z1)
    check('موبائل: «مختصر حالات» — ہر لفظ الگ، کوئی گم/جُڑا نہیں', len(t1) == exp and all(t in VOC for t in t1), (len(t1), exp, [t for t in t1 if t not in VOC][:3]))
    check('موبائل = لیپ ٹاپ: کالموں کی چوڑائی (کاغذ ایک)', all(abs(a - b) <= 2 for a, b in zip(dcols, mcols)), [dcols, mcols])
    mp.screenshot(path=V + 'mobile_challan.png')
    # ═══ 3) موبائل: ایک ملزم مٹایا → نمبر خود ہٹا → محفوظ ═══
    mp.evaluate("""() => { const el = document.querySelector('#ch173-doc [data-k="zer_hirasat"]'); el.focus(); _ch173UnwrapCell(el);
        el.innerText = el.innerText.split('\\n')[0]; el.dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    mp.evaluate("(() => { document.querySelector('#ch173-doc [data-k=\"halaat\"]').focus(); return 0; })()"); idle(mp, 1200)
    z2 = names(mp.evaluate(ZH))
    check('موبائل: ایک ملزم مٹایا → «1۔» خود ہٹا', len(z2) == 1 and not z2[0].startswith('1۔'), z2)
    mp.evaluate("_saveR173()"); idle(mp, 2200)
    # ═══ 4) لیپ ٹاپ: reload → وہی ═══
    relogin(dp)
    open_challan(dp, RID)
    z3 = names(dp.evaluate(ZH)); t3 = toks(dp.evaluate(BOTH))
    check('لیپ ٹاپ (reload کے بعد): ایک ملزم، بغیر نمبر — موبائل والی تبدیلی', z3 == z2, z3)
    check('لیپ ٹاپ (reload کے بعد): «مختصر حالات» — ہر لفظ الگ', len(t3) == exp and all(t in VOC for t in t3), (len(t3), exp))
    dp.screenshot(path=V + 'desktop_challan_after_reload.png')
    # ═══ 5) موبائل reload ═══
    relogin(mp)
    open_challan(mp, RID)
    z4 = names(mp.evaluate(ZH)); t4 = toks(mp.evaluate(BOTH))
    check('موبائل (reload کے بعد): وہی — ایک ملزم بغیر نمبر، ہر لفظ الگ', z4 == z2 and len(t4) == exp, (z4, len(t4)))
    check('سرور: کوئی اضافی / گمشدہ قطار نہیں (چالان 1)', len(db('report_173')) == 1, len(db('report_173')))
    check('دونوں آلات: کوئی JS غلطی نہیں', not D['errs'] and not M['errs'], (D['errs'][:2], M['errs'][:2]))
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
