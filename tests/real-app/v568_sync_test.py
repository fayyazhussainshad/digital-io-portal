"""(v568) TASK 7 — دو آلات ایک ساتھ (لیپ ٹاپ 1366×768 + موبائل 390×844 touch)، ایک سرور (mock_db_engine.py):
بیان 161: لکھو → محفوظ (بٹن / Ctrl+S) → reload → موجود → دوسرے آلے پر بھی (گواہ کا نام، بیان میں لکھی تاریخ)؛
ڈپلیکیٹ ضمنی: نقل → درستی → محفوظ → دوسرے آلے پر عام ضمنی (نشان نہیں)۔
چلانا: `python3 v568_sync_test.py`
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, BASE, OUT
from real import za_pick, za_save   # v577: بیان 161 — کونے کا «▾»، محفوظ «⋯» سے
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
    S.t['case_witnesses'] = [{'id': 'w1', 'case_id': CA, 'full_name': 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض', 'status': 'fir_eye', 'witness_type': 'fir', 'created_at': '2026-10-01'},
                             {'id': 'w2', 'case_id': CA, 'full_name': 'احمد علی ولد بشیر احمد', 'status': 'fir_eye', 'witness_type': 'fir', 'created_at': '2026-10-02'}]
    S.t['fir_matn'] = [{'id': 'm1', 'case_id': CA, 'type': 'fir', 'matn': 'میں مدعی مقدمہ ہوں۔', 'created_at': '2026-10-01'}]


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
    ZAROWS = "() => [...document.querySelectorAll('.zat-wrap tbody tr[data-zaid]')].map(r => [r.getAttribute('data-zaid'), r.querySelector('.dtc').innerText.trim(), r.querySelector('.wit').innerText.trim(), r.innerText.includes('سرور پر محفوظ')])"
    ROWS = "() => [...document.querySelectorAll('.zt tbody tr[data-zid]')].map(tr => [tr.getAttribute('data-zid'), tr.querySelector('td.num').innerText.trim(), tr.querySelector('td.dtc').innerText.trim(), tr.innerText.includes('ڈپلیکیٹ')])"

    def za_open(pg):
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("_openMisalEditor('statements_161')"); idle(pg, 1800)

    def za_new(pg, who, date, txt):
        pg.evaluate("_newZimniA()"); idle(pg, 1800)
        za_pick(pg, who, 1500)
        pg.evaluate("""(() => { const e = [...document.querySelectorAll('#ch173-doc .zfa-wit-stmt')].pop(); e.scrollIntoView({ block: 'center' }); e.focus();
          const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
        pg.keyboard.type(txt)
        pg.evaluate("(d) => { const e = [...document.querySelectorAll('#ch173-doc .zfa-wit-date')].pop(); e.textContent = d; return 0; }", date)
        idle(pg, 300)

    def za_back(pg):
        pg.evaluate("async () => { window.confirm = () => false; await _zaBackToList(); window.confirm = () => true; return 0; }"); idle(pg, 900)

    def relogin(pg):
        pg.reload(); idle(pg, 2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        idle(pg, 2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); idle(pg, 300)

    # ═══ C) لیپ ٹاپ: بیان 161 — «محفوظ» بٹن ═══
    za_open(dp)
    za_new(dp, 'غلام رسول', '02/11/2026', ' میں موقع پر موجود تھا۔')
    za_save(dp); idle(dp, 1800)
    rows = db('zimni_androoni_reports')
    srv = rows[0] if rows else {}
    sc = srv.get('content') or {}
    check('سرور: بیان 161 — گواہ کا نام (عنوان) اور بیان میں لکھی تاریخ 2026-11-02', len(rows) == 1 and srv.get('report_date') == '2026-11-02'
          and any('غلام رسول' in w for w in (sc.get('witnesses') or [])) and sc.get('doc_date') == '02/11/2026', (len(rows), srv.get('report_date'), sc.get('witnesses')))
    ZA1 = srv.get('id')
    za_back(dp)
    # ═══ موبائل: 10 سیکنڈ میں، بغیر refresh ═══
    za_open(mp)
    t = wait_until(mp, "id => [...document.querySelectorAll('.zat-wrap tr[data-zaid]')].some(r => r.getAttribute('data-zaid') === id)", ZA1)
    mr = mp.evaluate(ZAROWS)
    check('موبائل: لیپ ٹاپ کا بیان 10 سیکنڈ میں — 02/11/2026، «غلام رسول»، سرور پر محفوظ', t is not None and mr and mr[0][1] == '02/11/2026' and mr[0][2] == 'غلام رسول' and mr[0][3], [t, mr])
    mp.screenshot(path=OUT + '/v568_sync_01_mobile_161_list.png')
    # موبائل: دوسرا بیان — Ctrl+S
    za_new(mp, 'احمد علی', '03/11/2026', ' دوسرا بیان۔')
    mp.keyboard.press('Control+s'); idle(mp, 1800)
    check('سرور: موبائل کا بیان (Ctrl+S) — دو بیان', len(db('zimni_androoni_reports')) == 2, len(db('zimni_androoni_reports')))
    za_back(mp)
    t = wait_until(dp, "() => document.querySelectorAll('.zat-wrap tr[data-zaid]').length === 2", timeout=10)
    check('لیپ ٹاپ: موبائل کا بیان 10 سیکنڈ میں', t is not None, dp.evaluate(ZAROWS))
    # ═══ لیپ ٹاپ: reload → دونوں بیان موجود ═══
    relogin(dp); za_open(dp)
    dr = dp.evaluate(ZAROWS)
    check('لیپ ٹاپ (reload کے بعد): دونوں بیان — 03/11/2026 «احمد علی»، 02/11/2026 «غلام رسول»', [(r[1], r[2]) for r in dr] == [('03/11/2026', 'احمد علی'), ('02/11/2026', 'غلام رسول')], dr)
    dp.evaluate("id => _openZimniA(id)", ZA1); idle(dp, 2000)
    check('لیپ ٹاپ (reload کے بعد): بیان کھولا — متن جوں کا توں، کچھ نہیں بدلا', 'میں موقع پر موجود تھا۔' in dp.evaluate("document.getElementById('ch173-doc').textContent") and dp.evaluate("_zaDirty") is False)
    dp.screenshot(path=OUT + '/v568_sync_02_desktop_161_after_reload.png')
    za_back(dp)

    # ═══ B) ڈپلیکیٹ ضمنی — لیپ ٹاپ پر نقل، درستی، محفوظ؛ موبائل پر عام ضمنی ═══
    def type_c1(pg, sel, txt):
        pg.evaluate("""([sel, t]) => { const a = document.querySelector('#ch173-doc ' + sel); a.focus();
          const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
          document.execCommand('insertText', false, t); return 0; }""", [sel, txt])
        idle(pg, 500)
    def zsave(pg):
        pg.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()")
        pg.keyboard.press('Control+s'); idle(pg, 1800)
    dp.evaluate("c => openZimniEditor(c)", CA); idle(dp, 1200)
    dp.evaluate("_newZimni()"); idle(dp, 2200)
    type_c1(dp, 'tr.zf-blk .zf-actbody', '16/10/2026'); type_c1(dp, 'tr.zf-blk .zf-body', 'جناب عالیٰ! اصل ضمنی۔')
    zsave(dp)
    Z1 = (db('zimni_reports') or [{}])[0].get('id')
    dp.evaluate("async () => { window.confirm = () => false; await _zimniBackToList(); window.confirm = () => true; return 0; }"); idle(dp, 900)
    dp.click(f".zt tbody tr[data-zid='{Z1}'] button[title^='ڈپلیکیٹ']"); idle(dp, 2400)
    check('لیپ ٹاپ: «ڈپلیکیٹ» — نقل کھلی، نشان', dp.evaluate("(document.getElementById('zf-dup-badge') || {}).textContent") == 'ڈپلیکیٹ')
    zsave(dp)
    check('سرور: جوں کی توں نقل محفوظ نہیں ہوئی (وہی تاریخ + افسر + نمبر)', len(db('zimni_reports')) == 1, len(db('zimni_reports')))
    type_c1(dp, 'tr.zf-blk .zf-actbody', '17/10/2026'); type_c1(dp, '[data-k="zno"]', '2'); zsave(dp)
    zr = db('zimni_reports')
    check('سرور: درست نقل (17/10/2026، نمبر 2) محفوظ — اصل جوں کی توں', len(zr) == 2 and any((r.get('content') or {}).get('zno') == '2' and r.get('report_date') == '2026-10-17' for r in zr)
          and any(r['id'] == Z1 and r.get('report_date') == '2026-10-16' for r in zr), [(r.get('content') or {}).get('zno') for r in zr])
    mp.evaluate("c => openCaseWorkspace(c)", CA); idle(mp, 1300); mp.evaluate("c => openZimniEditor(c)", CA); idle(mp, 1200)
    t = wait_until(mp, "() => document.querySelectorAll('.zt tbody tr[data-zid]').length === 2 && !document.querySelector('.zt tbody tr.zt-draft')", timeout=10)
    mr = mp.evaluate(ROWS)
    check('موبائل: نقل سے بنی ضمنی 2 (17/10/2026) عام ضمنی — «ڈپلیکیٹ» نشان یا مسودہ نہیں', t is not None and [(r[1], r[2], r[3]) for r in mr] == [('2', '17/10/2026', False), ('1', '16/10/2026', False)], [t, mr])
    mp.screenshot(path=OUT + '/v568_sync_03_mobile_zimni_list.png')

    for d in (D, M):
        bad = [e for e in d['errs'] if 'ResizeObserver' not in e]
        check(f"[{d['label']}] صفحے پر کوئی JS غلطی نہیں", not bad, bad[:3])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
