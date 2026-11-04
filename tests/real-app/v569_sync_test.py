"""(v569) دو آلات ایک ساتھ (لیپ ٹاپ 1366×768 + موبائل 390×844 touch)، ایک سرور (mock_db_engine.py):
چالان (رپورٹ 173) اور بیرونی ضمنی — لکھو → محفوظ → دوسرے آلے پر کھولو → reload → دوبارہ کھولو:
متن جوں کا توں؛ چالان پر الفاظ کا آج والا فاصلہ (kerning بند)، ضمنی پر 3 نومبر سے پہلے والا (خودکار) — ہر آلے پر۔
چلانا: `python3 v569_sync_test.py`
"""
import os, sys, json, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, BASE, OUT
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'      # مقدمہ 681/26
V = OUT + '/v569/sync/'
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


HALAAT = '#ch173-doc [data-k="halaat"]'
ZBODY = '#ch173-doc tr.zf-blk .zf-body'
CH_TXT = ' مدعی مقدمہ نے بیان کیا کہ وہ اپنے موٹر سائیکل پر سوار ہو کر بازار سے واپس گھر آ رہا تھا کہ راستے میں نامعلوم ملزمان نے اسلحہ کے زور پر موبائل فون چھین لیا۔'
Z_TXT = 'جناب عالیٰ! بحوالہ رپورٹ ضمنی سابقہ گزارش ہے کہ مسل مقدمہ ہذا برائے تفتیش موصول ہوئی جس پر جائے وقوعہ پر پہنچ کر نقشہ موقع مرتب کیا گیا۔'
KERN = "(s) => { const e = document.querySelector(s); return e ? [getComputedStyle(e).fontKerning, e.textContent.replace(/\\s+/g, ' ').trim()] : null; }"
# پرنٹ کا آخری کاغذ — kerning (اسی آلے پر، چھپا iframe)
PAPER = """async ([sel, call]) => { window.__dp = []; window.__dioPaperAuto = 'legal'; const o = window._dioDoPrint; window._dioDoPrint = (h) => window.__dp.push(h);
  try { (0, eval)(call); for (let i = 0; i < 100 && !window.__dp.length; i++) await new Promise(r => setTimeout(r, 200)); } finally { window._dioDoPrint = o; window.__dioPaperAuto = undefined; }
  const h = window.__dp[0] || ''; if (!h) return null;
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-30000px;top:0;width:816px;height:1248px;border:0;';
  document.documentElement.appendChild(f); const d = f.contentDocument; d.open(); d.write(h); d.close();
  await new Promise(r => setTimeout(r, 700)); const e = d.querySelector(sel); const k = e ? f.contentWindow.getComputedStyle(e).fontKerning : null; f.remove(); return k; }"""


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

    def open_zimni(pg, zid):
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("c => openZimniEditor(c)", CA); idle(pg, 1300)
        pg.evaluate("(id) => { _openZimni(id); return 0; }", zid); idle(pg, 3000)

    D = device('desktop', viewport={'width': 1366, 'height': 768})
    M = device('mobile', viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2,
               user_agent='Mozilla/5.0 (Linux; Android 14; SM-A156E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36')
    dp, mp = D['pg'], M['pg']

    # ═══ 1) لیپ ٹاپ: چالان لکھو → محفوظ ═══
    dp.evaluate("c => openCaseWorkspace(c)", CA); idle(dp, 1300)
    dp.evaluate("openReport173WithType('mukammal')"); idle(dp, 2600)
    put(dp, HALAAT, CH_TXT)
    typed = dp.evaluate(KERN, HALAAT)
    dp.evaluate("_saveR173()"); idle(dp, 2200)
    rows = db('report_173')
    RID = rows[0]['id'] if rows else None
    check('سرور: چالان محفوظ (ایک قطار)', len(rows) == 1 and RID, len(rows))
    # ═══ 2) لیپ ٹاپ: ضمنی لکھو → Ctrl+S ═══
    dp.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    dp.evaluate("c => openCaseWorkspace(c)", CA); idle(dp, 1300)
    dp.evaluate("c => openZimniEditor(c)", CA); idle(dp, 1200)
    dp.evaluate("_newZimni()"); idle(dp, 2200)
    put(dp, '#ch173-doc tr.zf-blk .zf-actbody', '16/10/2026', True); put(dp, ZBODY, Z_TXT, True)
    ztyped = dp.evaluate(KERN, ZBODY)
    dp.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()")
    dp.keyboard.press('Control+s'); idle(dp, 2000)
    zr = db('zimni_reports')
    ZID = zr[0]['id'] if zr else None
    check('سرور: ضمنی محفوظ (Ctrl+S، ایک قطار)', len(zr) == 1 and ZID, len(zr))

    # ═══ 3) موبائل: دونوں کھولو ═══
    for tag, pg in (('موبائل', mp), ('لیپ ٹاپ (reload کے بعد)', dp)):
        if pg is dp: relogin(dp)
        open_challan(pg, RID)
        k = pg.evaluate(KERN, HALAAT)
        pk = pg.evaluate(PAPER, [HALAAT, '_printR173()'])
        check(f'{tag}: محفوظ چالان کھولا — حالات کا متن جوں کا توں؛ اسکرین اور کاغذ پر kerning بند (آج جیسا)',
              k and typed and k[1] == typed[1] and k[0] == 'none' and pk == 'none', (k and k[0], pk, k and len(k[1]), typed and len(typed[1])))
        pg.screenshot(path=V + ('mobile' if pg is mp else 'desktop') + '_challan.png')
        open_zimni(pg, ZID)
        k = pg.evaluate(KERN, ZBODY)
        pk = pg.evaluate(PAPER, [ZBODY, "document.querySelector('[data-dio-print]').click()"])
        check(f'{tag}: محفوظ ضمنی کھولی — متن جوں کا توں؛ اسکرین اور کاغذ پر kerning خودکار (3 نومبر سے پہلے جیسی)',
              k and ztyped and k[1] == ztyped[1] and k[0] == 'auto' and pk == 'auto', (k and k[0], pk, k and k[1][:40]))
        pg.screenshot(path=V + ('mobile' if pg is mp else 'desktop') + '_zimni.png')
    # ═══ 4) موبائل reload ═══
    relogin(mp)
    open_challan(mp, RID)
    k = mp.evaluate(KERN, HALAAT)
    check('موبائل (reload کے بعد): چالان — متن وہی، kerning بند', k and k[1] == typed[1] and k[0] == 'none', k and k[0])
    open_zimni(mp, ZID)
    k = mp.evaluate(KERN, ZBODY)
    check('موبائل (reload کے بعد): ضمنی — متن وہی، kerning خودکار', k and k[1] == ztyped[1] and k[0] == 'auto', k and k[0])
    check('سرور: کوئی اضافی / گمشدہ قطار نہیں (چالان 1، ضمنی 1)', len(db('report_173')) == 1 and len(db('zimni_reports')) == 1, (len(db('report_173')), len(db('zimni_reports'))))
    check('دونوں آلات: کوئی JS غلطی نہیں', not D['errs'] and not M['errs'], (D['errs'][:2], M['errs'][:2]))
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
