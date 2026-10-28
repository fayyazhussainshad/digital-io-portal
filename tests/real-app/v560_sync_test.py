"""(v560) آلات کے درمیان sync — اصل ایپ، دو آلات ایک ساتھ: لیپ ٹاپ (Desktop 1366×768) اور موبائل (390×844، touch)۔
ہر آلہ الگ browser context (اپنا localStorage / IndexedDB) — دونوں کا «سرور» ایک (mock-db-engine.js: rev trigger،
deleted_at، UUID، 23505، upsert) اور سرور کی ہر تبدیلی realtime کی طرح دونوں آلات تک۔

افسر کی قبولیت کی شرائط (28 اکتوبر 2026):
  1) لیپ ٹاپ پر نئی ضمنی → موبائل پر 10 سیکنڈ میں، بغیر refresh؛ اور موبائل → لیپ ٹاپ
  2) موبائل پر ترمیم → لیپ ٹاپ پر تازہ؛ ایک پر حذف → دوسرے سے غائب (اور «حذف شدہ مواد» سے بحال)
  3) موبائل آف لائن → محفوظ → آن لائن → سرور پر، دوہرا نہیں
  4) لکھتے لکھتے ٹیب بند → دوبارہ کھولیں → متن موجود (اور مسودہ دوسرے آلے پر بھی)
  5) دو آلات پر ایک ہی ضمنی بدلی: دونوں نسخے، افسر چنے؛ نہ چنا گیا «حذف شدہ مواد» میں
  + بیان 161، چالان، مقدمات، اوپر کی پٹی کی حالت، session نہ ہو تو «آف لائن»، لکھنے کی روک میں پڑھائی،
    جواب راستے میں ٹوٹے تو دوبارہ بھیجنا (دوہرا نہیں، ٹکراؤ نہیں)
چلانا: README.md — `python3 v560_sync_test.py`
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

    # ═══ 0) اوپر کی پٹی ═══
    for d in (D, M):
        t = wait_until(d['pg'], "() => { const t = document.getElementById('status-text'); return t && t.textContent === 'محفوظ'; }", timeout=12)
        check(f"[{d['label']}] اوپر کی پٹی: «محفوظ» (realtime + session)", t is not None, d['pg'].evaluate(STATUS))
        t = wait_until(d['pg'], "() => DIOSync.state().realtime === 'SUBSCRIBED'", timeout=10)
        check(f"[{d['label']}] زندہ رابطہ (realtime) SUBSCRIBED", t is not None, d['pg'].evaluate("DIOSync.state().realtime"))
    dp.screenshot(path=OUT + '/v560_00_desktop_status.png'); mp.screenshot(path=OUT + '/v560_00_mobile_status.png')

    # ═══ 1) لیپ ٹاپ → موبائل: نئی ضمنی ═══
    zopen(mp); zopen(dp)
    check('[mobile] ضمنی فہرست کھلی، خالی', mp.evaluate(LIST_IDS) == [] and mp.evaluate("!!document.querySelector('.zt-wrap')"))
    dp.evaluate("_newZimni()"); idle(dp, 1500)
    set_date(dp, '23/10/2026'); type_body(dp, ' لیپ ٹاپ سے لکھی گئی ضمنی')
    t_save = time.time()
    dp.keyboard.press('Control+s'); idle(dp, 1200)
    rows = db('zimni_reports')
    check('لیپ ٹاپ: Ctrl+S → سرور پر ایک ضمنی', len(rows) == 1, rows)
    back(dp)
    Z1 = rows[0]['id'] if rows else None
    check('سرور: مستقل UUID شناخت (local- نہیں)، rev 1، آلہ «لیپ ٹاپ»', bool(Z1) and len(Z1) == 36 and rows[0]['rev'] == 1 and 'لیپ ٹاپ' in (rows[0].get('last_device') or ''), rows[0] if rows else '')
    t = wait_until(mp, "id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z1)
    check('موبائل: لیپ ٹاپ کی ضمنی 10 سیکنڈ میں، بغیر refresh', t is not None, f'{t}s')
    check('موبائل: مقامی ذخیرے میں بھی (آف لائن پڑھنے کے لیے)', mp.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').length", CA) == 1)
    mp.screenshot(path=OUT + '/v560_01_mobile_got_desktop_zimni.png')

    # ═══ 2) موبائل → لیپ ٹاپ ═══
    mp.evaluate("_newZimni()"); idle(mp, 1500)
    set_date(mp, '24/10/2026'); type_body(mp, ' موبائل سے لکھی گئی ضمنی')
    save_zimni(mp); back(mp)
    rows = db('zimni_reports')
    Z2 = [r['id'] for r in rows if r['id'] != Z1]
    Z2 = Z2[0] if Z2 else None
    check('موبائل: «محفوظ» → سرور پر دوسری ضمنی (آلہ «موبائل»)', len(rows) == 2 and 'موبائل' in ((next((r for r in rows if r['id'] == Z2), {}) or {}).get('last_device') or ''), [(r['serial_no'], r.get('last_device')) for r in rows])
    wait_until(dp, "() => !!document.querySelector('.zt-wrap')", timeout=4)
    t = wait_until(dp, "id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z2)
    check('لیپ ٹاپ: موبائل کی ضمنی 10 سیکنڈ میں، بغیر refresh', t is not None, f'{t}s' if t is not None else dp.evaluate(DBG, Z2))
    dp.screenshot(path=OUT + '/v560_02_desktop_got_mobile_zimni.png')

    # ═══ 3) موبائل پر ترمیم → لیپ ٹاپ پر تازہ ═══
    wait_until(mp, "() => !!document.querySelector('.zt-wrap')", timeout=4)
    mp.evaluate("id => _openZimni(id)", Z1); idle(mp, 1500)
    type_body(mp, ' — موبائل پر ترمیم شدہ'); save_zimni(mp); back(mp)
    srvz1 = next((r for r in db('zimni_reports') if r['id'] == Z1), {})
    check('سرور: ترمیم اسی ضمنی میں (نئی نہیں)، rev 2', len(db('zimni_reports')) == 2 and srvz1.get('rev') == 2 and 'موبائل پر ترمیم شدہ' in ((srvz1.get('content') or {}).get('bodyHtml') or ''), srvz1.get('rev'))
    t = wait_until(dp, "id => { const z = (_zimniList||[]).find(x => x.id === id); return !!z && z.rev === 2 && String((z.content||{}).bodyHtml||'').includes('موبائل پر ترمیم شدہ'); }", Z1)
    check('لیپ ٹاپ: ترمیم 10 سیکنڈ میں فہرست میں', t is not None, f'{t}s')
    dp.evaluate("id => _openZimni(id)", Z1); idle(dp, 1400)
    check('لیپ ٹاپ: کھولنے پر نیا متن', 'موبائل پر ترمیم شدہ' in dp.evaluate("document.querySelector('#ch173-doc').innerText"))
    dp.evaluate("_renderZimniList()"); idle(dp, 500)

    # ═══ 4) لیپ ٹاپ پر حذف → موبائل سے غائب؛ «حذف شدہ مواد» سے بحال → واپس ═══
    wait_until(mp, "() => !!document.querySelector('.zt-wrap')", timeout=4)
    dp.evaluate("id => _deleteZimni(id, true)", Z2); idle(dp, 1500)
    srvz2 = next((r for r in db('zimni_reports') if r['id'] == Z2), None)
    check('سرور: «حذف» = نشان (قطار باقی، deleted_at)', bool(srvz2) and bool(srvz2.get('deleted_at')), srvz2 and srvz2.get('deleted_at'))
    bin_ = [x for x in db('recycle_bin') if x.get('item_id') == Z2]
    check('«حذف شدہ مواد» میں نقل', len(bin_) == 1 and bin_[0].get('item_type') == 'zimni', bin_)
    t = wait_until(mp, "id => ![...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z2)
    check('موبائل: حذف شدہ ضمنی 10 سیکنڈ میں غائب', t is not None, f'{t}s')
    dp.evaluate("async () => { await dioLoadScript('bin.js'); return 0; }"); idle(dp, 300)
    ok = dp.evaluate("async ([b]) => await _binRestore(b, 'zimni', true)", [bin_[0]['id']]) if bin_ else False
    srvz2 = next((r for r in db('zimni_reports') if r['id'] == Z2), None)
    check('بحالی: وہی قطار (وہی شناخت)، نشان ہٹا', bool(ok) and srvz2 and srvz2.get('deleted_at') is None and len(db('zimni_reports')) == 2, srvz2 and srvz2.get('deleted_at'))
    t = wait_until(mp, "id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z2)
    check('موبائل: بحال شدہ ضمنی واپس، بغیر refresh', t is not None, f'{t}s' if t is not None else mp.evaluate(DBG, Z2))

    # ═══ 5) موبائل آف لائن → محفوظ → آن لائن → سرور پر، دوہرا نہیں ═══
    M['ctx'].set_offline(True); idle(mp, 800)
    st = wait_until(mp, "() => document.getElementById('status-text').textContent === 'آف لائن'", timeout=5)
    check('موبائل آف لائن: پٹی «آف لائن»', st is not None, mp.evaluate(STATUS))
    mp.evaluate("_newZimni()"); idle(mp, 1500)
    set_date(mp, '25/10/2026'); type_body(mp, ' آف لائن لکھی گئی ضمنی'); save_zimni(mp); back(mp)
    check('آف لائن: سرور پر کچھ نہیں گیا', len([r for r in db('zimni_reports') if not r.get('deleted_at')]) == 2)
    loc = mp.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').filter(z => z._pending)", CA)
    check('آف لائن: اسی آلے پر «بھیجنا باقی» — مستقل UUID کے ساتھ', len(loc) == 1 and len(loc[0]['id']) == 36 and not loc[0]['id'].startswith('local-'), [z['id'] for z in loc])
    Z3 = loc[0]['id'] if loc else None
    mp.screenshot(path=OUT + '/v560_03_mobile_offline_saved.png')
    M['ctx'].set_offline(False)
    t = wait_until(mp, "() => 1", timeout=0.5)
    t = None
    t0 = time.time()
    while time.time() - t0 < 15:
        if any(r['id'] == Z3 for r in db('zimni_reports')): t = round(time.time() - t0, 2); break
        idle(mp, 300)
    check('آن لائن ہوتے ہی خود سرور پر (اسی شناخت سے)', t is not None, f'{t}s')
    mp.evaluate("async () => { await DIOSync.kick(true); await DIOSync.kick(true); return 0; }"); idle(mp, 1500)
    check('دوہرا نہیں (دوبارہ sync کے بعد بھی 3)', len([r for r in db('zimni_reports') if not r.get('deleted_at')]) == 3, len(db('zimni_reports')))
    t = wait_until(dp, "id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z3)
    check('لیپ ٹاپ: آف لائن والی ضمنی بھی آ گئی', t is not None, f'{t}s')
    st = wait_until(mp, "() => document.getElementById('status-text').textContent === 'محفوظ'", timeout=10)
    check('موبائل: پٹی واپس «محفوظ»', st is not None, mp.evaluate(STATUS))

    # ═══ 6) لکھتے لکھتے ٹیب بند → دوبارہ کھولیں → متن موجود؛ مسودہ دوسرے آلے پر بھی ═══
    dp.evaluate("_newZimni()"); idle(dp, 1500)
    set_date(dp, '26/10/2026'); type_body(dp, ' آدھی لکھی ضمنی جو ابھی محفوظ نہیں کی')
    idle(dp, 2200)        # خودکار مسودہ (1.5 سیکنڈ)
    dp.close()
    devices[:] = [x for x in devices if x is not D]
    pg2 = D['ctx'].new_page(); pg2.on('pageerror', lambda e: D['errs'].append(str(e)))
    login(pg2); D['pg'] = dp = pg2; devices.append(D)
    zopen(dp)
    drafts = dp.evaluate("[...document.querySelectorAll('.zt-wrap tr.zt-draft')].map(r => r.innerText)")
    check('دوبارہ کھولنے پر: «مسودہ — ابھی محفوظ نہیں کی گئی» قطار', len(drafts) == 1 and 'مسودہ' in drafts[0], drafts)
    dp.evaluate("() => { const k = Object.keys(JSON.parse(localStorage.getItem('dio_zimni_draft_" + CA + "')||'{}')).find(k => k.startsWith('new:')); _openZimniDraft(k); return 0; }"); idle(dp, 1500)
    check('مسودہ کھولنے پر لکھا ہوا متن واپس', 'آدھی لکھی ضمنی' in dp.evaluate("document.querySelector('#ch173-doc').innerText"))
    t0 = time.time(); ud = []
    while time.time() - t0 < 12:
        ud = [x for x in db('dio_user_data') if x['kind'] == 'zimni_draft' and not x.get('deleted_at')]
        if ud: break
        idle(dp, 300)
    check('مسودہ سرور پر بھی (dio_user_data، اسی مقدمے کی چابی)', len(ud) == 1 and ud[0]['doc_key'].startswith(CA + '|new:') and 'آدھی لکھی' in ud[0]['data'].get('bodyHtml', ''), [x['doc_key'] for x in ud])
    t = wait_until(mp, "() => [...document.querySelectorAll('.zt-wrap tr.zt-draft')].length === 1", timeout=12)
    check('موبائل: لیپ ٹاپ کا مسودہ فہرست میں (بغیر refresh)', t is not None, f'{t}s' if t is not None else (mp.evaluate(DBG, ''), mp.evaluate("c => localStorage.getItem('dio_zimni_draft_' + c)", CA)))
    mp.screenshot(path=OUT + '/v560_04_mobile_sees_desktop_draft.png')
    # مسودہ محفوظ = ضمنی؛ مسودہ ہر جگہ سے ختم
    dp.keyboard.press('Control+s'); idle(dp, 1500)
    check('مسودہ محفوظ → سرور پر ضمنی', len([r for r in db('zimni_reports') if not r.get('deleted_at')]) == 4)
    t = wait_until(mp, "() => [...document.querySelectorAll('.zt-wrap tr.zt-draft')].length === 0 && [...document.querySelectorAll('.zt-wrap tr[data-zid]')].length === 4", timeout=12)
    check('موبائل: مسودہ ہٹا، ضمنی آ گئی', t is not None, mp.evaluate(LIST_IDS))

    # ═══ 7) دو آلات پر ایک ہی ضمنی: دونوں نسخے، افسر چنے ═══
    dp.evaluate("_renderZimniList()"); idle(dp, 400)
    dp.evaluate("id => _openZimni(id)", Z1); idle(dp, 1400)
    mp.evaluate("id => _openZimni(id)", Z1); idle(mp, 1400)
    type_body(mp, ' [موبائل نسخہ]'); save_zimni(mp)
    type_body(dp, ' [لیپ ٹاپ نسخہ]')
    dp.keyboard.press('Control+s')
    t = wait_until(dp, "() => { const b = document.getElementById('modal-backdrop'); return b && b.style.display !== 'none' && /دو آلات/.test(document.getElementById('modal-title').textContent); }", timeout=6)
    body = dp.evaluate("document.getElementById('modal-body').innerText") if t is not None else ''
    check('لیپ ٹاپ: «دو آلات پر بدلی گئی» — دونوں نسخے سامنے', t is not None and '[لیپ ٹاپ نسخہ]' in body and '[موبائل نسخہ]' in body, body[:200])
    marks = dp.evaluate("[...document.querySelectorAll('#modal-body .dio-cf-diff mark')].map(m => m.textContent)") if t is not None else []
    check('مکالمے میں «فرق» نمایاں — صرف بدلا ہوا حصہ (لیپ ٹاپ / موبائل)', len(marks) == 2 and 'لیپ ٹاپ' in marks[0] and 'موبائل' in marks[1] and 'ضلع' not in ''.join(marks), marks)
    bd_asi = dp.evaluate("[...document.querySelectorAll('#modal-body .dio-cf-txt bdi')].map(b => b.textContent)") if t is not None else []
    check('مکالمے کے متن میں انگریزی / ہندسے الگ رُخ (bdi) — ASI، تاریخ', 'ASI' in bd_asi and any('/' in x for x in bd_asi), bd_asi[:8])
    srvz1 = next((r for r in db('zimni_reports') if r['id'] == Z1), {})
    check('فیصلے سے پہلے سرور پر موبائل والا ہی (کچھ خاموشی سے نہیں مٹا)', '[موبائل نسخہ]' in srvz1['content']['bodyHtml'] and '[لیپ ٹاپ نسخہ]' not in srvz1['content']['bodyHtml'])
    idle(dp, 700); dp.screenshot(path=OUT + '/v560_05_desktop_conflict_dialog.png')     # کارڈ کے ابھرنے (fade) کے بعد
    dp.evaluate("() => { document.querySelector('#modal-body [data-pick=\"mine\"]').click(); return 0; }"); idle(dp, 1800)
    srvz1 = next((r for r in db('zimni_reports') if r['id'] == Z1), {})
    lost = [x for x in db('recycle_bin') if (x.get('item_data') or {}).get('_conflict_copy')]
    check('«یہ نسخہ رکھیں» (لیپ ٹاپ) → سرور پر لیپ ٹاپ والا', '[لیپ ٹاپ نسخہ]' in srvz1['content']['bodyHtml'], srvz1.get('rev'))
    check('نہ چنا گیا (موبائل) نسخہ «حذف شدہ مواد» میں، نئی شناخت سے', len(lost) == 1 and '[موبائل نسخہ]' in json.dumps(lost[0]['item_data'], ensure_ascii=False) and lost[0]['item_id'] != Z1, len(lost))
    t = wait_until(mp, "id => { const z = (_zimniList||[]).find(x => x.id === id); return !!z && String((z.content||{}).bodyHtml||'').includes('[لیپ ٹاپ نسخہ]'); }", Z1)
    check('موبائل: فیصلہ شدہ نسخہ پہنچ گیا', t is not None, f'{t}s')
    # «ابھی نہیں» — دونوں رہیں، فہرست میں «دو نسخے»
    mp.evaluate("_renderZimniList()"); idle(mp, 300)
    mp.evaluate("id => _openZimni(id)", Z1); idle(mp, 1400)
    dp.evaluate("_renderZimniList()"); idle(dp, 300)
    dp.evaluate("id => _openZimni(id)", Z1); idle(dp, 1400)
    type_body(dp, ' [لیپ ٹاپ دوسری بار]'); dp.keyboard.press('Control+s'); idle(dp, 1500)
    type_body(mp, ' [موبائل دوسری بار]'); save_zimni(mp)
    t = wait_until(mp, "() => { const b = document.getElementById('modal-backdrop'); return b && b.style.display !== 'none' && /دو آلات/.test(document.getElementById('modal-title').textContent); }", timeout=6)
    idle(mp, 700); mp.screenshot(path=OUT + '/v560_06_mobile_conflict_dialog.png')
    mp.evaluate("() => { document.querySelector('#modal-footer [data-pick=\"later\"]').click(); return 0; }"); idle(mp, 1200)
    badge = mp.evaluate("[...document.querySelectorAll('.zt-wrap .zst-c')].length")
    check('موبائل: «ابھی نہیں» → فہرست میں «دو نسخے — فیصلہ کریں»', t is not None and badge == 1, badge)
    loc = mp.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').find(z => z._conflict)", CA)
    check('موبائل: دونوں نسخے اسی آلے پر محفوظ (اپنا + سرور والا)', bool(loc) and '[موبائل دوسری بار]' in loc['content']['bodyHtml'] and '[لیپ ٹاپ دوسری بار]' in loc['_conflict']['content']['bodyHtml'])
    mp.screenshot(path=OUT + '/v560_07_mobile_two_versions_badge.png')
    mp.evaluate("id => { _zimniResolve(id); return 0; }", Z1); idle(mp, 800)
    mp.evaluate("() => { document.querySelector('#modal-body [data-pick=\"theirs\"]').click(); return 0; }"); idle(mp, 1800)
    srvz1 = next((r for r in db('zimni_reports') if r['id'] == Z1), {})
    lost = [x for x in db('recycle_bin') if '[موبائل دوسری بار]' in json.dumps(x.get('item_data') or {}, ensure_ascii=False)]
    check('«سرور والا رکھیں» → سرور جوں کا توں، موبائل والا «حذف شدہ مواد» میں', '[لیپ ٹاپ دوسری بار]' in srvz1['content']['bodyHtml'] and len(lost) == 1)
    check('موبائل: «دو نسخے» کا نشان ختم', mp.evaluate("[...document.querySelectorAll('.zt-wrap .zst-c')].length") == 0)

    # ═══ 8) بیان 161 (اندرونی ضمنی) — لیپ ٹاپ → موبائل ═══
    def za_open(pg):
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("_openMisalEditor('statements_161')"); idle(pg, 1800)
    za_open(mp); za_open(dp)
    dp.click("button:has-text('بیان درج کریں')"); idle(dp, 1800)
    v = dp.evaluate("() => { const o = [...document.querySelectorAll('#zfa-wit-sel option')].find(o => /مدعی|زاہد/.test(o.textContent)); return o ? o.value : null; }")
    if v: dp.select_option('#zfa-wit-sel', v); idle(dp, 1200)
    dp.click('#ch173-doc .zfa-wit-stmt'); dp.keyboard.press('End'); dp.keyboard.type(' میں موقع پر موجود تھا۔'); idle(dp, 300)
    dp.keyboard.press('Control+s'); idle(dp, 1500)
    za = db('zimni_androoni_reports')
    check('بیان: لیپ ٹاپ سے سرور پر (UUID، rev 1)', len(za) == 1 and len(za[0]['id']) == 36 and za[0]['rev'] == 1, za[:1])
    t = wait_until(mp, "() => [...document.querySelectorAll('.zat-wrap tr[data-zaid]')].length === 1", timeout=10)
    check('موبائل: بیان 10 سیکنڈ میں فہرست میں', t is not None, f'{t}s')

    # ═══ 9) چالان — لیپ ٹاپ → موبائل؛ موبائل پر حذف → لیپ ٹاپ سے غائب ═══
    def r173_open(pg):
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("openR173List()"); idle(pg, 1500)
    r173_open(mp); r173_open(dp)
    dp.evaluate("_r173NewDoc(false)"); idle(dp, 2500)
    dp.evaluate("async () => { await _saveR173(); return 0; }"); idle(dp, 1500)
    rr = db('report_173')
    check('چالان: لیپ ٹاپ سے سرور پر (UUID، rev 1)', len(rr) == 1 and len(rr[0]['id']) == 36 and rr[0]['rev'] == 1, [(r['report_type'], r.get('rev')) for r in rr])
    t = wait_until(mp, "() => !!document.querySelector('.r173-list-wrap') && (_r173Docs||[]).length === 1 && document.querySelectorAll('.r173-list-wrap tbody tr[ondblclick]').length === 1", timeout=10)
    check('موبائل: چالان 10 سیکنڈ میں فہرست میں', t is not None, f'{t}s')
    R1 = rr[0]['id'] if rr else ''
    mp.evaluate("id => _r173DeleteDoc(id)", R1); idle(mp, 1500)
    rr = db('report_173')
    check('چالان حذف = نشان (قطار باقی) + «حذف شدہ مواد»', len(rr) == 1 and bool(rr[0].get('deleted_at')) and any(x.get('item_id') == R1 and x.get('item_type') == 'r173' for x in db('recycle_bin')))
    t = wait_until(dp, "() => (_r173Docs||[]).length === 0 && document.querySelectorAll('.r173-list-wrap tbody tr[ondblclick]').length === 0", timeout=10)
    check('لیپ ٹاپ: حذف شدہ چالان 10 سیکنڈ میں غائب', t is not None, f'{t}s')

    # ═══ 10) مقدمات — نیا مقدمہ / حذف ═══
    mp.evaluate("showPage('cases', null)"); idle(mp, 1800)
    # فہرست میں «702» اور «/26» الگ خانوں میں لکھے ہوتے ہیں — خالی جگہ ہٹا کر دیکھو
    CS_TXT = "(document.getElementById('cs-rows')||{innerText:''}).innerText.replace(/\\s+/g, '')"
    check('موبائل: مقدمات کی فہرست کھلی، 702/26 ابھی نہیں', '702/26' not in mp.evaluate(CS_TXT) and '681/26' in mp.evaluate(CS_TXT), mp.evaluate(CS_TXT)[:80])
    dp.evaluate("""async () => { await addCase({ fir_number: '702/26', section_of_law: '411 ت پ', status: 'under', complainant: 'نیا مدعی', fir_date: '27/10/2026' }); return 0; }"""); idle(dp, 800)
    nc = [c for c in db('cases') if c['fir_number'] == '702/26']
    check('مقدمہ: لیپ ٹاپ سے سرور پر', len(nc) == 1, nc)
    t = wait_until(mp, "() => " + CS_TXT + ".includes('702/26')", timeout=10)
    check('موبائل: نیا مقدمہ فہرست میں 10 سیکنڈ میں', t is not None, f'{t}s')
    NC = nc[0]['id'] if nc else ''
    dp.evaluate("async (id) => { await doDeleteCase(id); return 0; }", NC); idle(dp, 1500)
    nc = [c for c in db('cases') if c['id'] == NC]
    check('مقدمہ حذف = نشان + «حذف شدہ مواد»', len(nc) == 1 and bool(nc[0].get('deleted_at')) and any(x.get('item_id') == NC and x.get('item_type') == 'case' for x in db('recycle_bin')))
    t = wait_until(mp, "() => !" + CS_TXT + ".includes('702/26') && " + CS_TXT + ".includes('681/26')", timeout=10)
    check('موبائل: حذف شدہ مقدمہ فہرست سے غائب', t is not None, f'{t}s')
    t = wait_until(mp, "async (id) => !(await offlineStore.getOne('cases_cache', id))", NC, timeout=10)
    check('موبائل: حذف شدہ مقدمہ cache سے بھی ہٹا (پہلے ہمیشہ رہتا)', t is not None)
    mp.screenshot(path=OUT + '/v560_08_mobile_cases.png')
    # مقدمے کی ترمیم: دونوں آلات پر الگ خانے → دونوں ترامیم رہیں (کچھ نہ مٹے)
    base = dp.evaluate("async (id) => await getCase(id)", CB)
    mp.evaluate("""async (id) => { const c = await getCase(id); await updateCase(id, { complainant: c.complainant, occurrence_place: 'موبائل والا بحد' }, c); return 0; }""", CB)
    idle(mp, 600)
    dp.evaluate("""async ([id, base]) => { await updateCase(id, { complainant: 'لیپ ٹاپ والا مدعی', occurrence_place: base.occurrence_place || '' }, base); return 0; }""", [CB, base])
    idle(dp, 800)
    cb = next(c for c in db('cases') if c['id'] == CB)
    check('مقدمہ: دو آلات پر الگ خانے بدلے → دونوں ترامیم محفوظ (پرانا فارم دوسری کو نہیں مٹاتا)', cb['complainant'] == 'لیپ ٹاپ والا مدعی' and cb['occurrence_place'] == 'موبائل والا بحد', (cb['complainant'], cb.get('occurrence_place')))

    # ═══ 11) session نہ ہو (انٹرنیٹ ہے مگر سرور سے رابطہ نہیں) — «آف لائن» صاف ═══
    mp.evaluate("() => { window.__noSession = true; window._dioReauthIfNeeded = async () => false; return 0; }")
    mp.evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(mp, 500)
    stt = mp.evaluate(STATUS)
    check('session نہیں: پٹی «آف لائن» (پہلے «آن لائن» لکھا آتا تھا)', stt == ['آف لائن', 'nosession'], stt)
    mp.evaluate("DIOSync.showDetails()"); idle(mp, 600)
    det = mp.evaluate("document.getElementById('modal-body').innerText")
    check('تفصیل: «لاگ اِن ختم … کام اسی آلے پر محفوظ» + دوبارہ جوڑنے کا بٹن', 'لاگ اِن' in det and 'محفوظ' in det and mp.evaluate("!!document.querySelector('#modal-footer button')"), det[:120])
    mp.screenshot(path=OUT + '/v560_09_mobile_nosession.png')
    mp.evaluate("closeModal(); window.__noSession = false"); mp.evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(mp, 500)

    # ═══ 12) لکھنے کی روک (DIO.sub._blocked) — sync پڑھائی نہیں روکتا، اور سرور پر کچھ نہیں بھیجتا ═══
    #   نوٹ: اصل «میعاد ختم» پر موجودہ live ایپ پورا تالا لگاتی ہے (subscription.js _dioHardLock) — وہ
    #   اس تبدیلی میں نہیں چھیڑا گیا؛ افسر کا فیصلہ باقی (رپورٹ میں سوال)۔ یہاں صرف sync کا اپنا رویہ۔
    dp.evaluate("() => { DIO.sub._blocked = true; return 0; }")
    zopen(dp)
    n_rows = len(dp.evaluate(LIST_IDS))
    check('لکھنے کی روک: ضمنیات کی فہرست پڑھی جا سکتی ہے', n_rows == 4, n_rows)
    ud_before = json.dumps(db('dio_user_data'), sort_keys=True)
    dp.evaluate("id => _openZimni(id)", Z1); idle(dp, 1400)
    type_body(dp, ' [روک کے دوران لکھا]'); idle(dp, 2500)
    check('لکھنے کی روک: مسودہ سرور پر نہیں بھیجا (سرور ویسے بھی رد کرتا)', json.dumps(db('dio_user_data'), sort_keys=True) == ud_before)
    dp.evaluate("() => { DIO.sub._blocked = false; return 0; }")
    dp.evaluate("() => { try { _zimniClearDraft('id:' + _zimniActive.id); } catch (e) {} _zimniDirty = false; return 0; }")
    dp.evaluate("_renderZimniList()"); idle(dp, 400)

    # ═══ 13) جواب راستے میں ٹوٹا (سرور پر لکھا گیا، آلے تک «ہو گیا» نہیں پہنچا) → دوبارہ بھیجنا: دوہرا نہیں، ٹکراؤ نہیں ═══
    def cb_rows():
        return [r for r in db('zimni_reports') if r['case_id'] == CB and not r.get('deleted_at')]
    def m_pending():
        return mp.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').filter(z => z._pending || z._conflict).length", CB)
    mp.evaluate("try { closeModal() } catch (e) {}"); idle(mp, 300)
    zopen(mp, CB)
    RT_HOLD[0] = True          # سرور کا realtime واقعہ دیر سے — صرف دوبارہ بھیجنے کا راستہ
    def zlog(n0):
        return [(op, cols, err, n) for (t, op, cols, err, n) in S.log[n0:] if t == 'zimni_reports']
    # جواب ٹوٹا + اس کے فوراً بعد فہرست کی تازگی بھی نہ پہنچ سکی (کمزور نیٹ) — اب صرف دوبارہ بھیجنا ہی راستہ
    mp.evaluate("_newZimni()"); idle(mp, 1500)
    set_date(mp, '27/10/2026'); type_body(mp, ' نئی ضمنی — جواب راستے میں ٹوٹا')
    S.opts['lost'] = ['zimni_reports:insert']; S.opts['netfail'] = ['zimni_reports:select:case_id']
    n0 = len(S.log)
    save_zimni(mp); back(mp)
    loc = mp.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]')", CB)
    check('جواب ٹوٹا (نئی): سرور پر لکھی گئی، متن آلے پر «بھیجنا باقی»', len(cb_rows()) == 1 and len(loc) == 1 and 'جواب راستے میں ٹوٹا' in json.dumps(loc, ensure_ascii=False) and m_pending() == 1, (len(cb_rows()), len(loc), m_pending()))
    mp.evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(mp, 1500)
    writes = [x for x in zlog(n0) if x[0] != 'select']
    print('   (راستہ — نئی):', zlog(n0), flush=True)
    check('جواب ٹوٹا (نئی): دوبارہ بھیجی — اسی شناخت پر (سرور: «پہلے سے موجود») → اسی کو تازہ، نئی قطار نہیں', len(writes) >= 3 and writes[0][2] == 'net-reply-lost' and writes[1][:1] == ('insert',) and writes[1][2] == '23505' and writes[2][0] == 'update', writes)
    t = wait_until(mp, "(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').filter(z => z._pending || z._conflict).length === 0", CB, timeout=10)
    rows = cb_rows()
    check('دوبارہ بھیجنے پر: ایک ہی ضمنی (دوہری نہیں)، «دو نسخے» نہیں', t is not None and len(rows) == 1 and m_pending() == 0, (len(rows), m_pending()))
    Z4 = rows[0]['id'] if rows else ''
    rev_before = rows[0]['rev'] if rows else None
    bin_before = len(db('recycle_bin'))
    RT_HOLD[0] = False; idle(mp, 600); RT_HOLD[0] = True
    mp.evaluate("id => _openZimni(id)", Z4); idle(mp, 1400)
    type_body(mp, ' [ترمیم — جواب ٹوٹا]')
    S.opts['lost'] = ['zimni_reports:update']; S.opts['netfail'] = ['zimni_reports:select:case_id']
    n1 = len(S.log)
    save_zimni(mp); back(mp)
    r4 = next((r for r in db('zimni_reports') if r['id'] == Z4), {})
    rev_lost = r4.get('rev')
    check('جواب ٹوٹا (ترمیم): سرور پر نیا متن (ایک بار لکھا گیا)، آلے پر «بھیجنا باقی»', '[ترمیم — جواب ٹوٹا]' in (r4.get('content') or {}).get('bodyHtml', '') and rev_lost == (rev_before or 0) + 1 and m_pending() == 1, (rev_before, rev_lost, m_pending()))
    mp.evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(mp, 1500)
    lg = zlog(n1)
    print('   (راستہ — ترمیم):', lg, flush=True)
    upd = [x for x in lg if x[0] == 'update']
    check('جواب ٹوٹا (ترمیم): دوبارہ بھیجا — سرور نے پرانے rev پر 0 قطار کہا، آلے نے پہچانا کہ یہی تحریر پہنچ چکی', len(upd) >= 2 and upd[0][2] == 'net-reply-lost' and 'rev' in upd[1][1] and upd[1][3] == 0, upd)
    t = wait_until(mp, "(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').filter(z => z._pending || z._conflict).length === 0", CB, timeout=10)
    r4 = next((r for r in db('zimni_reports') if r['id'] == Z4), {})
    dlg = mp.evaluate("() => { const b = document.getElementById('modal-backdrop'); return !!b && b.style.display !== 'none' && /دو آلات/.test(document.getElementById('modal-title').textContent); }")
    check('دوبارہ بھیجنے پر: «دو آلات» کا مکالمہ نہیں، «حذف شدہ مواد» میں نقل نہیں، سرور پر دوبارہ نہیں لکھا', t is not None and not dlg and len(db('recycle_bin')) == bin_before and r4.get('rev') == rev_lost and len(cb_rows()) == 1, (r4.get('rev'), rev_lost, dlg, len(db('recycle_bin')) - bin_before))
    RT_HOLD[0] = False; idle(mp, 800)     # دیر سے پہنچا realtime — کچھ نہیں بگڑتا
    n_list = mp.evaluate(LIST_IDS)
    check('دیر سے پہنچا realtime: فہرست میں ایک ہی ضمنی، «دو نسخے» نہیں', n_list == [Z4] and m_pending() == 0 and mp.evaluate("[...document.querySelectorAll('.zt-wrap .zst-c')].length") == 0, (n_list, m_pending()))
    st = wait_until(mp, "() => document.getElementById('status-text').textContent === 'محفوظ'", timeout=10)
    check('جواب ٹوٹنے کے بعد پٹی واپس «محفوظ»', st is not None, mp.evaluate(STATUS))

    for d in (D, M):
        bad = [e for e in d['errs'] if 'ResizeObserver' not in e]
        check(f"[{d['label']}] صفحے پر کوئی JS غلطی نہیں", not bad, bad[:3])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
