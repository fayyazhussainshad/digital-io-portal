"""(v566) TASK 6 — دو آلات ایک ساتھ (لیپ ٹاپ 1366×768 + موبائل 390×844 touch)، ایک سرور (mock_db_engine.py):
محفوظ → reload → موجود → دوسرے آلے پر بھی: ضمنی نمبر «2-الف»، کالم 1 کی تاریخ، سینئر افسر (SHO) کی ضمنی، 161 کا نمبر،
ملزمان ▾ (کچھ خود نہیں لگتا؛ دوسرے آلے پر کھولنے سے کچھ نہیں بدلتا)؛ اسی تاریخ پر تفتیشی افسر کی اپنی ضمنی جائز۔
چلانا: `python3 v566_sync_test.py`
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, BASE, OUT
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'      # مقدمہ 681/26
CB = '1a7e0c4e-0000-4000-8000-0000000006b2'      # مقدمہ 645/26

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
    S.t['cases'] = [
        {'id': CA, 'officer_id': 'o1', 'fir_number': '681/26', 'section_of_law': '380 ت پ', 'occurrence_date': '2026-10-08', 'occurrence_place': 'وقاص ٹاؤن ملتان', 'status': 'under',
         'complainant': 'ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None},
        {'id': CB, 'officer_id': 'o1', 'fir_number': '645/26', 'section_of_law': '379 ت پ', 'occurrence_date': '2026-10-03', 'status': 'under',
         'complainant': 'محمد اسلم ولد غلام رسول', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None}]
    S.t['case_accused'] = [{'id': 'a1', 'case_id': CA, 'name': 'نامعلوم ملزم', 'accused_type': 'fir', 'created_at': '2026-10-08'}]
    for k in ('zimni_reports', 'zimni_androoni_reports', 'report_173', 'dio_user_data', 'recycle_bin', 'incident_reports'): S.t[k] = []


with sync_playwright() as p:
    b = p.chromium.launch()
    # ── مشترک «سرور» (Python) ──
    S = DB(); seed(S)
    devices = []

    def srv_exec(source, st):
        return S.exec(st)          # realtime واقعات قطار میں — pump() سب آلات تک پہنچاتا ہے

    RT_HOLD = [False]      # True = realtime واقعات روکے رکھو (دیر سے پہنچیں) — دوبارہ بھیجنے کا راستہ الگ سے جانچنے کو

    def pump():
        if RT_HOLD[0]: return
        evts = S.take_events()
        if not evts: return
        for d in list(devices):
            try: d['pg'].evaluate('e => window.__rtDeliver ? __rtDeliver(e) : 0', evts)
            except Exception: pass   # بند صفحہ

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

    def wait_until(pg, js, arg=None, timeout=10.0):
        t0 = time.time()
        while time.time() - t0 < timeout:
            pump()
            try:
                if pg.evaluate(js, arg) if arg is not None else pg.evaluate(js): return round(time.time() - t0, 2)
            except Exception: pass
            idle(pg, 150)
        return None

    def zopen(pg, cid=CA):
        pg.evaluate("c => openCaseWorkspace(c)", cid); idle(pg, 1300)
        pg.evaluate("c => openZimniEditor(c)", cid); idle(pg, 1000)

    def set_date(pg, d):
        pg.evaluate("""(d) => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = d; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; }""", d)
        idle(pg, 300)

    def type_body(pg, txt):
        pg.click('#ch173-doc .zf-body'); pg.keyboard.press('End'); pg.keyboard.type(txt); idle(pg, 250)

    def save_zimni(pg):
        # ضمنی کا اپنا «💾 محفوظ» — مگر پورے صفحے والے منظر (#dio-dv-body، مثلاً چالان کی فہرست کھولنے کے
        # بعد) میں وہ چھپا ہوتا ہے اور اوپر کی پٹی کا «محفوظ» (#dio-dv-save) کام کرتا ہے — موبائل پر وہ پٹی اوپر
        # scroll سے سامنے آتی ہے؛ یہاں سیدھا اسی بٹن کو دبایا جاتا ہے (وہی جو افسر کی انگلی دباتی ہے)
        if pg.evaluate("() => { const b = document.getElementById('zf-save-btn'); return !!b && b.getBoundingClientRect().width > 0; }"):
            pg.click('#zf-save-btn')
        elif pg.evaluate("() => !!document.getElementById('dio-dv-save')"):
            pg.evaluate("() => { document.getElementById('dio-dv-save').click(); return 0; }")
        else:
            pg.click('#ch173-doc .zf-body'); pg.keyboard.press('Control+s')
        idle(pg, 1500)

    def back(pg):
        # «محفوظ» / Ctrl+S ضمنی کھلی رکھتے ہیں — افسر «واپس» سے فہرست پر آتا ہے
        pg.evaluate("async () => { await _zimniBackToList(); return 0; }"); idle(pg, 700)

    DBG = """(id) => ({ list: [...document.querySelectorAll('.zt-wrap tr[data-zid]')].map(r => r.getAttribute('data-zid').slice(0,6)), mem: (_zimniList||[]).map(z => String(z.id).slice(0,6)),
      ls: JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]').map(z => String(z.id).slice(0,6)), want: String(id).slice(0,6), act: document.activeElement && (document.activeElement.tagName + '.' + document.activeElement.className),
      wrap: !!document.querySelector('.zt-wrap'), subs: (window.__rtSubs||[]).length, rt: DIOSync.state().realtime, cid: String(_zimniCaseId).slice(-4) })"""
    LIST_IDS = "() => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].map(r => r.getAttribute('data-zid'))"
    STATUS = "() => { const t = document.getElementById('status-text'); return t ? [t.textContent, t.parentNode.getAttribute('data-sync')] : null; }"


    D = device('desktop', viewport={'width': 1366, 'height': 768})
    M = device('mobile', viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
               user_agent='Mozilla/5.0 (Linux; Android 14; SM-A156E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36')
    dp, mp = D['pg'], M['pg']
    for d in (D, M):
        wait_until(d['pg'], "() => DIOSync.state().realtime === 'SUBSCRIBED'", timeout=10)
    S.t['case_accused'] = [{'id': 'a1', 'case_id': CA, 'name': 'محمد شفیق ولد رفیق', 'accused_type': 'fir', 'created_at': '2026-10-08'},
                           {'id': 'a2', 'case_id': CA, 'name': 'غلام عباس ولد اللہ دتہ', 'accused_type': 'fir', 'created_at': '2026-10-09'}]
    BANAM = "() => [...document.querySelectorAll('#ch173-doc [data-k=\"banam\"] .zf-acc .nm')].map(n => n.textContent.trim())"
    ROWS = "() => [...document.querySelectorAll('.zt tbody tr[data-zid]')].map(tr => [tr.getAttribute('data-zid'), tr.querySelector('td.num').innerText.trim(), tr.querySelector('td.dtc').innerText.trim(), tr.cells[2].innerText.trim()])"

    def type_c1(pg, txt):
        pg.evaluate("""(t) => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.focus();
          const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
          document.execCommand('insertText', false, t); return 0; }""", txt)
        idle(pg, 600)

    # ═══ لیپ ٹاپ: سینئر (SHO) ضمنی، نمبر 2-الف، کالم 1 کی تاریخ 29/10، 161، ایک ملزم ▾ سے ═══
    zopen(dp)
    dp.evaluate("_newZimni()"); idle(dp, 2200)
    check('لیپ ٹاپ: نئی ضمنی میں کوئی ملزم خود نہیں لگا', dp.evaluate(BANAM) == [], dp.evaluate(BANAM))
    type_c1(dp, '29/10/2026 بیان 161 ض ف')
    dp.click('#zf-cp-main'); idle(dp, 300); dp.click("#zf-cp-menu button[data-v='SHO کی ضمنی']"); idle(dp, 600)   # v575: کاغذ کے کونے کا ▾
    dp.evaluate("""() => { const z = document.querySelector('#ch173-doc [data-k="zno"]'); z.textContent = '2-الف'; return 0; }""")
    dp.click('#ch173-doc .zf-pick[data-which=fir]'); idle(dp, 500)
    dp.locator('#zf-acc-menu input[type=checkbox]').nth(0).click(); idle(dp, 300)
    dp.click('#zf-acc-x'); idle(dp, 200)
    picked = dp.evaluate(BANAM)
    type_body(dp, ' لیپ ٹاپ سے SHO کی ضمنی')
    dp.click('#zf-save-btn'); idle(dp, 1500)
    rows = db('zimni_reports')
    srv = rows[0] if rows else {}
    sc = srv.get('content') or {}
    check('سرور: ایک ضمنی — serial_no 2، content.zno «2-الف»، report_date 2026-10-29 (کالم 1)، لکھنے والا SHO',
          len(rows) == 1 and srv.get('serial_no') == 2 and sc.get('zno') == '2-الف' and srv.get('report_date') == '2026-10-29'
          and (sc.get('author') or {}).get('role') == 'sho', (len(rows), srv.get('serial_no'), sc.get('zno'), srv.get('report_date'), sc.get('author')))
    check('سرور: 161 کا نمبر (1) اور ▾ محفوظ متن میں نہیں', 'zf-161n' in sc.get('bodyHtml', '') and '>(1)<' in sc.get('bodyHtml', '') and 'zf-pick' not in sc.get('bodyHtml', ''))
    ZID = srv.get('id')
    back(dp)

    # ═══ دوسرا آلہ (موبائل): 10 سیکنڈ میں، بغیر refresh — وہی نمبر، تاریخ، افسر ═══
    zopen(mp)
    t = wait_until(mp, "id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", ZID)
    mrows = mp.evaluate(ROWS)
    check('موبائل: لیپ ٹاپ کی ضمنی 10 سیکنڈ میں — «2-الف»، 29/10/2026، SHO کا نام', t is not None and mrows and mrows[0][1] == '2-الف' and mrows[0][2] == '29/10/2026' and 'ندیم عباس شاد' in mrows[0][3], [t, mrows])
    mp.screenshot(path=OUT + '/v566_sync_01_mobile_list.png')
    mp.evaluate("id => _openZimni(id)", ZID); idle(mp, 2500)
    check('موبائل: کھولا — «بنام» وہی جو لیپ ٹاپ پر چنا (کچھ دوبارہ نہیں لگا)', mp.evaluate(BANAM) == picked and len(picked) == 1, [mp.evaluate(BANAM), picked])
    check('موبائل: «لکھنے والا: SHO» اور نمبر «2-الف»', mp.evaluate("_zimniAuthorNow().role") == 'sho'
          and mp.evaluate("document.querySelector('#ch173-doc [data-k=\"zno\"]').textContent") == '2-الف')
    # موبائل پر ▾ سے دوسرا ملزم بھی (اصل انگلی)
    mp.tap('#ch173-doc .zf-pick[data-which=fir]'); idle(mp, 600)
    mp.locator('#zf-acc-menu input[type=checkbox]').nth(1).tap(); idle(mp, 300)
    mp.tap('#zf-acc-x'); idle(mp, 200)
    m2 = mp.evaluate(BANAM)
    check('موبائل: ▾ (انگلی) سے دوسرا ملزم — دونوں، 1۔ 2۔', len(m2) == 2 and m2[0].startswith('1۔') and m2[1].startswith('2۔'), m2)
    save_zimni(mp); back(mp)
    srv = next((r for r in db('zimni_reports') if r['id'] == ZID), {})
    check('سرور: موبائل کی ترمیم اسی ضمنی میں (نئی نہیں)', len(db('zimni_reports')) == 1 and srv.get('rev') == 2, srv.get('rev'))

    # ═══ لیپ ٹاپ: reload (صفحہ بند کر کے دوبارہ) → تمام ڈیٹا موجود ═══
    dp.reload(); idle(dp, 2500)
    dp.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    idle(dp, 2500); dp.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); idle(dp, 300)
    zopen(dp)
    drows = dp.evaluate(ROWS)
    check('لیپ ٹاپ (reload کے بعد): «2-الف»، 29/10/2026، SHO کا نام', drows and drows[0][1] == '2-الف' and drows[0][2] == '29/10/2026' and 'ندیم عباس شاد' in drows[0][3], drows)
    dp.evaluate("id => _openZimni(id)", ZID); idle(dp, 2500)
    check('لیپ ٹاپ (reload کے بعد): موبائل والے دونوں ملزم، 161 کا (1)، کچھ بدلا نہیں', dp.evaluate(BANAM) == m2
          and dp.evaluate("[...document.querySelectorAll('#ch173-doc .zf-161n')].map(m => m.textContent)") == ['(1)'] and dp.evaluate("_zimniDirty") is False,
          [dp.evaluate(BANAM), m2])
    dp.screenshot(path=OUT + '/v566_sync_02_desktop_after_reload.png')
    # اسی تاریخ پر تفتیشی افسر کی اپنی ضمنی (دوسرا افسر) — اجازت؛ پھر SHO دوبارہ — خبردار
    back(dp)
    dp.evaluate("_newZimni()"); idle(dp, 2200)
    type_c1(dp, '29/10/2026')
    dp.click('#zf-save-btn'); idle(dp, 1500)
    check('تفتیشی افسر: اسی تاریخ (29/10) پر اپنی ضمنی — اجازت (SHO دوسرا افسر ہے)', len(db('zimni_reports')) == 2, len(db('zimni_reports')))
    t = wait_until(mp, "() => document.querySelectorAll('.zt-wrap tr[data-zid]').length === 2", timeout=10)
    check('موبائل: دوسری ضمنی بھی 10 سیکنڈ میں', t is not None, mp.evaluate(ROWS))

    for d in (D, M):
        bad = [e for e in d['errs'] if 'ResizeObserver' not in e]
        check(f"[{d['label']}] صفحے پر کوئی JS غلطی نہیں", not bad, bad[:3])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
