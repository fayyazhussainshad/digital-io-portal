"""(TASK 22) دو آلات (لیپ ٹاپ 1366×768 + موبائل 390×844 touch)، ایک سرور (mock_db_engine.py) — ٹیبوں کے اندر:
لیپ ٹاپ کی ٹیب میں ضمنی لکھو → Ctrl+S → سرور → موبائل کی کھلی ٹیب میں بغیر refresh (اوپر کی کھڑکی کا ایک ہی realtime رابطہ)
→ لیپ ٹاپ reload → ٹیبیں واپس → وہی ضمنی کھلی، متن جوں کا توں → موبائل پر ترمیم → لیپ ٹاپ پر بغیر refresh۔
چلانا: `python3 t22_sync_test.py`
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, TABS_FORCE, BASE, OUT, tabs_ctx
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'      # مقدمہ 681/26
V = OUT + '/t22/sync/'
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
    S.t['case_accused'] = [{'id': 'a1', 'case_id': CA, 'name': 'نامعلوم ملزم', 'accused_type': 'fir', 'created_at': '2026-10-08'}]
    for k in ('zimni_reports', 'zimni_androoni_reports', 'report_173', 'dio_user_data', 'recycle_bin', 'incident_reports', 'case_witnesses'): S.t[k] = []
    S.t['fir_matn'] = [{'id': 'm1', 'case_id': CA, 'type': 'fir', 'matn': 'میں مدعی مقدمہ ہوں۔', 'created_at': '2026-10-01'}]

Z_TXT = 'جناب عالیٰ! بحوالہ رپورٹ ضمنی سابقہ گزارش ہے کہ مسل مقدمہ ہذا برائے تفتیش موصول ہوئی جس پر جائے وقوعہ پر پہنچ کر نقشہ موقع مرتب کیا گیا۔'
Z_ADD = ' موبائل پر اضافہ: گواہان کے بیانات قلمبند کیے گئے۔'
ACTIVE = """() => { const S = DIOTabs._state(); const t = S.tabs.find(x => x.id === S.active); const e = t && t.entries[t.idx];
  const r = e && S.frames[e.fid]; return (r && r.win && r.win.DIOTabsChild && r.win.DIOTabsChild.ready && !t.loading && !e.pending) ? e.fid : null; }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    S = DB(); seed(S)
    devices = []

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

    def db(table): return json.loads(json.dumps(S.t.get(table, [])))

    def route(r):
        u = r.request.url
        if 'supabase' in u and u.endswith('.js'):
            return r.fulfill(path=SHARED, content_type='application/javascript')
        return real_route(r)

    def af(pg):
        for _ in range(200):
            fid = pg.evaluate(ACTIVE)
            if fid:
                for f in pg.frames:
                    if f.name == 'dio-tab-' + fid: return f
            idle(pg, 150)
        raise RuntimeError('tab not ready')

    def login(pg):
        idle(pg, 2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        idle(pg, 1500); af(pg); idle(pg, 500)
        pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); idle(pg, 300)   # پہلی بار کا تعارف (اوپر کی کھڑکی)

    def device(label, **ctxargs):
        ctx = tabs_ctx(b.new_context(service_workers='block', timezone_id='Asia/Karachi', **ctxargs))
        ctx.route('**/*', route)
        ctx.expose_binding('__srv', lambda source, st: S.exec(st))
        ctx.add_init_script(TABS_FORCE + PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));\nwindow.confirm = () => true;")
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: d.accept())
        pg.goto(BASE + 'index.html'); login(pg)
        d = {'label': label, 'ctx': ctx, 'pg': pg, 'errs': errs}
        devices.append(d)
        return d

    def zimni_list(f, pg):
        f.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 300); f = af(pg)
        f.evaluate("_openMisalEditor('zamniyat'); 0"); idle(pg, 300); f = af(pg); idle(pg, 1500)
        return af(pg)

    def rows(f):
        return f.evaluate("[...document.querySelectorAll('.zt tbody tr[data-zid]')].map(tr => tr.getAttribute('data-zid'))")

    D = device('desktop', viewport={'width': 1366, 'height': 768})
    M = device('mobile', viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2,
               user_agent='Mozilla/5.0 (Linux; Android 14; SM-A156E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36')
    dp, mp = D['pg'], M['pg']
    check('دونوں آلات: ٹیبوں کی پٹی، پہلی ٹیب ڈیش بورڈ', all(x.evaluate("document.body.classList.contains('dio-tabs-on') && DIOTabs._state().tabs.length === 1") for x in (dp, mp)))

    # ── موبائل: ضمنیات کی فہرست کھلی چھوڑو (ابھی خالی) ──
    mf = zimni_list(af(mp), mp)
    check('موبائل: ٹیب میں ضمنیات کی فہرست (ابھی خالی)', rows(mf) == [], rows(mf))

    # ── لیپ ٹاپ: ٹیب میں نئی ضمنی → Ctrl+S ──
    df = zimni_list(af(dp), dp)
    df.click("button:has-text('ضمنی درج کریں')"); idle(dp, 2300); df = af(dp)
    df.evaluate("""(t) => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); let r = document.createRange(); r.selectNodeContents(a); let s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026');
        const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus(); r = document.createRange(); r.selectNodeContents(e); s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); r.collapse(false); return 0; }""", Z_TXT)
    idle(dp, 500)
    dp.keyboard.press('Control+s'); idle(dp, 2500)
    zr = db('zimni_reports')
    ZID = zr[0]['id'] if zr else None
    check('سرور: ٹیب کے اندر Ctrl+S سے ضمنی محفوظ (ایک قطار)', len(zr) == 1 and ZID and Z_TXT[:20] in json.dumps(zr[0], ensure_ascii=False), len(zr))
    dp.screenshot(path=V + 'desktop_saved_in_tab.png')

    # ── موبائل: اسی کھلی ٹیب میں، بغیر refresh ──
    got = False
    for _ in range(40):
        idle(mp, 300)
        if ZID in (rows(af(mp)) or []): got = True; break
    check('موبائل: لیپ ٹاپ کی ضمنی کھلی ٹیب کی فہرست میں 12 سیکنڈ کے اندر، بغیر refresh', got, rows(af(mp)))
    mp.screenshot(path=V + 'mobile_list_live.png')

    # ── لیپ ٹاپ reload → (لاگ اِن) → ٹیبیں واپس ──
    tabs_before = dp.evaluate("DIOTabs._state().tabs.map(t => t.entries[t.idx].t)")
    dp.reload(); login(dp)
    tabs_after = dp.evaluate("DIOTabs._state().tabs.map(t => (t.entries[t.idx] || {}).t)")
    check('لیپ ٹاپ reload → ٹیبیں واپس (ڈیش بورڈ سامنے)', tabs_after[0] == 'ڈیش بورڈ' and len(tabs_after) == len(tabs_before) + (0 if tabs_before[0] == 'ڈیش بورڈ' else 1), [tabs_before, tabs_after])
    # بحال ضمنی والی ٹیب پر جاؤ
    idx = next((i for i, t in enumerate(tabs_after) if (t or '').startswith('ضمنی')), None)
    if idx is not None:
        dp.click(f'#dio-tabs-strip .dio-tab >> nth={idx}'); idle(dp, 2500)
    df = af(dp)
    txt = df.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); return e ? e.innerText : ''; })()")
    check('لیپ ٹاپ reload کے بعد: وہی محفوظ ضمنی ٹیب میں کھلی، متن جوں کا توں', Z_TXT in txt, txt[:60])

    # ── موبائل: کھولو، اضافہ کرو، محفوظ ──
    mf = af(mp)
    mf.evaluate("(id) => { _openZimni(id); return 0; }", ZID); idle(mp, 2500); mf = af(mp)
    mtxt = mf.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); return e ? e.innerText : ''; })()")
    check('موبائل: ٹیب میں وہی ضمنی، متن جوں کا توں', Z_TXT in mtxt, mtxt[:60])
    mf.evaluate("""(t) => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", Z_ADD)
    idle(mp, 400)
    mf.evaluate("_saveZimni(false, true); 0"); idle(mp, 2500)
    zr = db('zimni_reports')
    check('سرور: موبائل کی ترمیم (وہی قطار، دوہرا نہیں)', len(zr) == 1 and Z_ADD.strip()[:15] in json.dumps(zr[0], ensure_ascii=False), len(zr))

    # ── موبائل آف لائن: ٹیب میں نئی ضمنی → محفوظ (اسی آلے پر) → آن لائن → اوپر کی کھڑکی خود سرور پر بھیجے، دوہرا نہیں ──
    n_before = len([r for r in db('zimni_reports') if not r.get('deleted_at')])
    M['ctx'].set_offline(True); idle(mp, 800)
    mf = af(mp)
    mf.evaluate("_zimniBackToList(); 0"); idle(mp, 1500); mf = af(mp)
    mf.evaluate("_newZimni(); 0"); idle(mp, 1800); mf = af(mp)
    mf.evaluate("""(t) => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); let r = document.createRange(); r.selectNodeContents(a); let s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '25/10/2026');
        const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus(); r = document.createRange(); r.selectNodeContents(e); s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", 'آف لائن لکھی گئی ضمنی (ٹیب میں)')
    idle(mp, 400)
    mf.evaluate("_saveZimni(false, true); 0"); idle(mp, 2000)
    off_srv = len([r for r in db('zimni_reports') if not r.get('deleted_at')])
    pend = mf.evaluate("(c) => JSON.parse(localStorage.getItem('dio_zimni_' + c) || '[]').filter(z => z._pending).map(z => z.id)", CA)
    check('موبائل آف لائن: ٹیب میں محفوظ = اسی آلے پر «بھیجنا باقی»، سرور پر ابھی کچھ نہیں', off_srv == n_before and len(pend) == 1, [off_srv, pend])
    M['ctx'].set_offline(False)
    t = None; t0 = time.time()
    while time.time() - t0 < 20:
        if pend and any(r['id'] == pend[0] for r in db('zimni_reports')): t = round(time.time() - t0, 1); break
        idle(mp, 300)
    check('آن لائن ہوتے ہی اوپر کی کھڑکی نے ٹیب والی ضمنی سرور پر بھیجی (اسی شناخت سے)', t is not None, f'{t}s')
    idle(mp, 3000)
    check('دوہرا نہیں (ٹیبیں ایک ہی قطار دو بار نہیں بھیجتیں)', len([r for r in db('zimni_reports') if not r.get('deleted_at')]) == n_before + 1, len(db('zimni_reports')))

    # ── لیپ ٹاپ: دوسری ٹیب میں فہرست → موبائل والا نسخہ ──
    dp.click('#dio-tabs-strip [data-act="new"]'); idle(dp, 800); df2 = zimni_list(af(dp), dp)
    df2.evaluate("(id) => { _openZimni(id); return 0; }", ZID); idle(dp, 2500); df2 = af(dp)
    t2 = df2.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); return e ? e.innerText : ''; })()")
    check('لیپ ٹاپ (نئی ٹیب): موبائل والا اضافہ نظر آیا', Z_ADD.strip()[:15] in t2, t2[-60:])
    dp.screenshot(path=V + 'desktop_after_mobile_edit.png')
    check('دونوں آلات: کوئی JS غلطی نہیں', not D['errs'] and not M['errs'], (D['errs'][:2], M['errs'][:2]))
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
json.dump(R, open(V + 'results.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
