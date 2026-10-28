"""(v561) افسر کا حکم، 28 اکتوبر 2026 — اصل ایپ، Desktop 1366×768 + Mobile 390×844:
  A) سبسکرپشن ختم = صرف دیکھنا — پڑھنا کھلا؛ پرنٹ (بٹن، Ctrl+P، window.print)، PDF/Word شیئر،
     لکھنا (سرور پر کچھ نہیں)، ترمیم (ٹائپ، paste، انتخاب) سب بند؛ تلاش کھلی؛ console سے نہیں کھلتا؛
     تجدید کے بعد سب کھلا۔ معطل سبسکرپشن = پہلے جیسا پورا تالا۔
  B) SHO / DSP-SDPO کا نام سب آلات پر ایک (ایک پر بدلا → دوسرے پر 10 سیکنڈ میں، بغیر refresh)
  C) مقدمہ شیئر مکمل ختم — دوسرے افسر کا مقدمہ نہ فہرست میں، نہ realtime سے آلے پر؛ case_shares سے کچھ نہیں منگوایا جاتا
  D) گشت نظام سے باہر — Dashboard، نیا اندراج، تلاش، ٹمپلیٹ، صفحہ: کہیں نہیں
چلانا: README.md — `python3 v561_test.py`
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, BASE, OUT
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'      # مقدمہ 681/26 (اپنا)
CX = '1a7e0c4e-0000-4000-8000-0000000009c9'      # دوسرے افسر کا مقدمہ (پہلے شیئر کیا گیا تھا)
Z1 = '2b8f1d5f-0000-4000-8000-000000000a01'

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:300] if extra != '' else ''), flush=True)

def seed(S, sub_status='active', exp='2027-12-31T00:00:00Z'):
    t = '2026-10-08T00:00:00Z'
    S.t['officers'] = [
        {'id': 'o1', 'user_id': 'u1', 'email': 'io@test.pk', 'full_name': 'فیاض حسین شاد', 'designation': 'ASI', 'badge_number': '1234',
         'station': 'صدر ملتان', 'district': 'ملتان', 'role': 'officer', 'is_approved': True, 'suspended': False, 'created_at': '2026-01-01T00:00:00Z'},
        {'id': 'o2', 'user_id': 'u2', 'email': 'other@test.pk', 'full_name': 'دوسرا افسر', 'designation': 'SI', 'badge_number': '9999',
         'station': 'صدر ملتان', 'district': 'ملتان', 'role': 'officer', 'is_approved': True, 'suspended': False, 'created_at': '2026-01-01T00:00:00Z'}]
    S.t['subscriptions'] = [{'id': 's1', 'officer_id': 'o1', 'status': sub_status, 'start_date': '2026-01-01', 'end_date': exp[:10], 'expires_at': exp,
        'created_at': '2026-01-01T00:00:00Z', 'subscription_plans': {'name': 'سالانہ', 'duration_days': 365}}]
    S.t['cases'] = [
        {'id': CA, 'officer_id': 'o1', 'fir_number': '681/26', 'section_of_law': '380 ت پ', 'occurrence_date': '2026-10-08', 'occurrence_place': 'وقاص ٹاؤن ملتان', 'status': 'under',
         'complainant': 'ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None},
        {'id': CX, 'officer_id': 'o2', 'fir_number': '999/26', 'section_of_law': '392 ت پ', 'occurrence_date': '2026-10-01', 'status': 'under',
         'complainant': 'دوسرے افسر کا مدعی', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None}]
    S.t['case_shares'] = [{'id': 'sh1', 'case_id': CX, 'shared_by': 'o2', 'shared_with': 'o1', 'permission': 'read', 'revoked_at': None, 'created_at': t}]
    S.t['case_accused'] = [{'id': 'a1', 'case_id': CA, 'name': 'نامعلوم ملزم', 'accused_type': 'fir', 'created_at': '2026-10-08'}]
    S.t['zimni_reports'] = [{'id': Z1, 'case_id': CA, 'officer_id': 'o1', 'serial_no': 1, 'report_date': '2026-10-23', 'rev': 1, 'deleted_at': None,
        'created_at': t, 'updated_at': t, 'last_device': 'لیپ ٹاپ',
        'content': {'bodyHtml': '<p>جناب عالی! بحوالہ رپورٹ — پہلے سے لکھی ضمنی کا متن (پڑھنے کی جانچ)</p>', 'saved_at': t, 'sub_type': 'رپورٹ ضمنی'}}]
    for k in ('zimni_androoni_reports', 'report_173', 'dio_user_data', 'recycle_bin', 'incident_reports'): S.t[k] = []


with sync_playwright() as p:
    b = p.chromium.launch()
    devices = []
    MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; SM-A156E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36'

    def pump():
        for d in list(devices):
            evts = d['S'].take_events() if d['S'] is not None else []
            if not evts: continue
            for d2 in list(devices):
                if d2['S'] is not d['S']: continue
                try: d2['pg'].evaluate('e => window.__rtDeliver ? __rtDeliver(e) : 0', evts)
                except Exception: pass

    def idle(pg, ms):
        end = time.time() + ms / 1000.0
        while True:
            pump()
            left = end - time.time()
            if left <= 0: break
            pg.wait_for_timeout(min(150, int(left * 1000) + 1))
        pump()

    def wait_until(pg, js, arg=None, timeout=10.0):
        t0 = time.time()
        while time.time() - t0 < timeout:
            pump()
            try:
                if (pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)): return round(time.time() - t0, 2)
            except Exception: pass
            idle(pg, 150)
        return None

    def route(r):
        u = r.request.url
        if 'supabase' in u and u.endswith('.js'):
            return r.fulfill(path=SHARED, content_type='application/javascript')
        return real_route(r)

    def login(pg, wait_banner=True):
        pg.goto(BASE + 'index.html'); idle(pg, 2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        idle(pg, 2500)
        pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
        if wait_banner:
            pg.evaluate("async () => { try { await showSubscriptionBanner(); } catch (e) {} return 0; }")   # (ایپ خود 3 سیکنڈ بعد بھی چلاتی ہے)
        idle(pg, 600)
        pg.evaluate("try{closeModal()}catch(e){}")

    def device(label, S, **ctxargs):
        ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', **ctxargs)
        ctx.route('**/*', route)
        ctx.expose_binding('__srv', lambda source, st: S.exec(st))
        ctx.add_init_script(PRINT_HOOK + "\nwindow.confirm = () => true;" +
            "\nif (!localStorage.getItem('digital_io_sho')) localStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        d = {'label': label, 'ctx': ctx, 'pg': pg, 'errs': errs, 'S': S}
        devices.append(d)
        login(pg)
        return d

    def toasts_hook(pg):
        pg.evaluate("""(() => { window.__toasts = []; if (!window.__toastHooked) { window.__toastHooked = true; const o = window.showToast;
          window.showToast = function (m, t) { window.__toasts.push([t || 'info', String(m)]); return o.apply(this, arguments); }; } return 0; })()""")

    def snap_hook(pg):
        pg.evaluate("""(() => { window.__snaps = [];
          window.__snapObs = window.__snapObs || new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
            if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; } })));
          window.__snapObs.observe(document.body, { childList: true }); return 0; })()""")

    def writes(S, n0):
        return [x for x in S.log[n0:] if x[1] in ('insert', 'update', 'upsert', 'delete')]

    STATUS = "() => { const t = document.getElementById('status-text'); return t ? t.textContent : null; }"

    # ═══ A) سبسکرپشن ختم = صرف دیکھنا ═══
    for label, kw in (('desktop', {'viewport': {'width': 1366, 'height': 768}}),
                      ('mobile', {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'user_agent': MOBILE_UA})):
        SE = DB(); seed(SE, 'expired', '2026-10-01T00:00:00Z')
        D = device(label + '-expired', SE, **kw); pg = D['pg']
        tag = f'[{label}] میعاد ختم'
        check(f'{tag}: پورا تالا نہیں — ایپ کھلی', not pg.evaluate("!!document.getElementById('dio-sub-lock')") and pg.evaluate("document.getElementById('main-app').style.display !== 'none'"))
        bar = pg.evaluate("(document.getElementById('dio-viewonly-bar')||{innerText:''}).innerText")
        check(f'{tag}: اوپر «صرف دیکھ سکتے ہیں — پرنٹ، نیا اندراج اور ترمیم بند» + تجدید کا بٹن', 'صرف دیکھ سکتے ہیں' in bar and 'پرنٹ' in bar and 'تجدید کریں' in bar, bar[:120])
        t = wait_until(pg, "() => document.getElementById('status-text').textContent === 'صرف دیکھنا'", timeout=8)
        check(f'{tag}: اوپر کی پٹی «صرف دیکھنا» (نظر آتا ہے)', t is not None and pg.evaluate("document.getElementById('status-text').getBoundingClientRect().width") > 10, pg.evaluate(STATUS))
        pg.screenshot(path=f'{OUT}/v561_{label}_01_viewonly_dashboard.png')
        n0 = len(SE.log)
        # پڑھنا: مقدمات، ضمنی کھلتی ہے
        pg.evaluate("showPage('cases', null)"); idle(pg, 1800)
        cs = pg.evaluate("(document.getElementById('cs-rows')||{innerText:''}).innerText.replace(/\\s+/g, '')")
        check(f'{tag}: مقدمات کی فہرست پڑھی جا سکتی ہے', '681/26' in cs, cs[:60])
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("c => openZimniEditor(c)", CA); idle(pg, 1200)
        check(f'{tag}: ضمنیات کی فہرست میں پرانی ضمنی', pg.evaluate("id => [...document.querySelectorAll('.zt-wrap tr[data-zid]')].some(r => r.getAttribute('data-zid') === id)", Z1))
        pg.evaluate("id => _openZimni(id)", Z1); idle(pg, 1500)
        body = pg.evaluate("(document.querySelector('#ch173-doc')||{innerText:''}).innerText")
        check(f'{tag}: ضمنی کھلی — متن نظر آتا ہے', 'پہلے سے لکھی ضمنی' in body, body[:80])
        # ترمیم بند
        toasts_hook(pg)
        ed = pg.evaluate("""() => { const e = document.querySelector('#ch173-doc');
          return { ce: e ? e.getAttribute('contenteditable') : null, ro: !!(e && e.closest('[data-dio-ro]')), any: document.querySelectorAll('#ch173-doc [contenteditable="true"]').length }; }""")
        check(f'{tag}: ضمنی کا متن صرف پڑھنے کے لیے (contenteditable=false)', ed['ce'] == 'false' and ed['ro'] and ed['any'] == 0, ed)
        before = pg.evaluate("document.querySelector('#ch173-doc').innerText")
        pg.click('#ch173-doc p'); pg.keyboard.press('End'); pg.keyboard.type(' ٹائپ کی کوشش'); idle(pg, 400)
        pg.evaluate("""() => { const e = document.querySelector('#ch173-doc p'); const dt = new DataTransfer(); dt.setData('text/plain', 'PASTE');
          e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); return 0; }""")
        after = pg.evaluate("document.querySelector('#ch173-doc').innerText")
        ts = pg.evaluate("window.__toasts")
        check(f'{tag}: ٹائپ / paste سے متن نہیں بدلا + پیغام «ترمیم بند»', after == before and 'ٹائپ کی کوشش' not in after and any('ترمیم' in m for _, m in ts), [after == before, ts[-2:]])
        sel = pg.evaluate("[...document.querySelectorAll('#ch173-doc select, .zf-toolbar select, select')].filter(s => s.offsetParent && !/filter/i.test(s.id)).map(s => s.disabled)")
        check(f'{tag}: ضمنی کے انتخاب (ذیلی ضمنی وغیرہ) بھی بند', len(sel) > 0 and all(sel), sel)
        toasts_hook(pg)
        pg.keyboard.press('Control+s'); idle(pg, 800)
        check(f'{tag}: Ctrl+S → کچھ محفوظ نہیں، پیغام', not writes(SE, n0) and any(('محفوظ' in m or 'بند' in m) for _, m in pg.evaluate("window.__toasts")), pg.evaluate("window.__toasts")[-2:])
        # پرنٹ بند — بٹن، Ctrl+P، window.print
        snap_hook(pg); toasts_hook(pg)
        pc0 = pg.evaluate("window.__printCalls")
        pg.evaluate("window.__dioPaperAuto = 'legal'; 0")
        pg.evaluate("id => { _printZimniById(id); return 0; }", Z1); idle(pg, 1500)
        pg.keyboard.press('Control+p'); idle(pg, 800)
        pg.evaluate("() => { window.print(); return 0; }"); idle(pg, 300)
        pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
        check(f'{tag}: پرنٹ بٹن / Ctrl+P / window.print — کچھ نہیں چھپا', pg.evaluate("(window.__snaps||[]).length") == 0 and pg.evaluate("window.__printCalls") == pc0,
              [pg.evaluate("(window.__snaps||[]).length"), pg.evaluate("window.__printCalls") - pc0])
        check(f'{tag}: پرنٹ کی کوشش پر صاف پیغام', any('پرنٹ' in m for _, m in pg.evaluate("window.__toasts")), pg.evaluate("window.__toasts")[-3:])
        # براؤزر مینو سے پرنٹ: کاغذ پر کچھ نہیں
        pg.emulate_media(media='print')
        vis = pg.evaluate("() => [...document.body.children].filter(e => getComputedStyle(e).display !== 'none').length")
        pg.emulate_media(media='screen')
        check(f'{tag}: براؤزر کے اپنے پرنٹ میں صفحہ خالی (صرف «پرنٹ بند» پیغام)', vis == 0, vis)
        # PDF / Word شیئر بند
        pg.evaluate("try{closeModal()}catch(e){}"); idle(pg, 200)
        r = pg.evaluate("async () => { const x = await dioSharePrint(() => {}, 'جانچ'); return [x, !!document.getElementById('dio-share-box')]; }"); idle(pg, 300)
        check(f'{tag}: PDF / Word شیئر نہیں کھلتا', r == [True, False], r)
        # نیا اندراج بند
        pg.evaluate("try{closeModal()}catch(e){}"); idle(pg, 200)
        pg.evaluate("window.DIOEntry && DIOEntry.hub()"); idle(pg, 500)
        title = pg.evaluate("(document.getElementById('modal-title')||{textContent:''}).textContent")
        check(f'{tag}: «نیا اندراج» نہیں کھلتا (تجدید کا پلان سامنے)', title != 'نیا اندراج', title)
        pg.evaluate("try{closeModal()}catch(e){}"); idle(pg, 200)
        # تلاش کھلی
        pg.evaluate("showPage('dashboard', null)"); idle(pg, 1200)
        pg.click('#sr-query'); pg.keyboard.type('681'); idle(pg, 1800)
        q = pg.evaluate("document.getElementById('sr-query').value"); res = pg.evaluate("(document.getElementById('sr-results')||{innerText:''}).innerText")
        check(f'{tag}: تلاش کا خانہ کھلا اور نتیجہ آتا ہے', q == '681' and '681' in res, [q, res[:60]])
        # سرور پر کچھ نہیں لکھا گیا
        check(f'{tag}: پورے دوران سرور پر کوئی لکھائی نہیں', not writes(SE, n0), writes(SE, n0)[:3])
        # console سے نہیں کھلتا
        r = pg.evaluate("() => { DIO.sub._blocked = false; return [DIO.sub.blocked(), DIO.sub.guard('جانچ')]; }")
        check(f'{tag}: console سے DIO.sub._blocked = false — پھر بھی بند', r == [True, False], r)
        pg.evaluate("try{closeModal()}catch(e){}")
        pg.screenshot(path=f'{OUT}/v561_{label}_02_viewonly_after.png')
        # تجدید → سب کھلا
        SE.t['subscriptions'][0].update({'status': 'active', 'end_date': '2027-12-31', 'expires_at': '2027-12-31T00:00:00Z'})
        with pg.expect_navigation(timeout=15000):
            pg.click('#dio-lock-recheck')
        login(pg)
        zt = wait_until(pg, "() => !document.getElementById('dio-viewonly-bar') && !DIO.sub.blocked()", timeout=8)
        check(f'{tag}: تجدید کے بعد «صرف دیکھنا» ختم', zt is not None, pg.evaluate("[!!document.getElementById('dio-viewonly-bar'), DIO.sub.blocked()]"))
        pg.evaluate("c => openCaseWorkspace(c)", CA); idle(pg, 1300)
        pg.evaluate("c => openZimniEditor(c)", CA); idle(pg, 1000)
        pg.evaluate("id => _openZimni(id)", Z1); idle(pg, 1500)
        pg.click('#ch173-doc p'); pg.keyboard.press('End'); pg.keyboard.type(' تجدید کے بعد'); idle(pg, 300)
        check(f'{tag}: تجدید کے بعد لکھنا ممکن', 'تجدید کے بعد' in pg.evaluate("document.querySelector('#ch173-doc').innerText"))
        bad = [e for e in D['errs'] if 'ResizeObserver' not in e]
        check(f'{tag}: صفحے پر کوئی JS غلطی نہیں', not bad, bad[:3])
        D['ctx'].close(); devices.remove(D)

    # معطل سبسکرپشن — پہلے جیسا پورا تالا
    SS = DB(); seed(SS, 'suspended', '2027-12-31T00:00:00Z')
    DS_ = device('desktop-suspended', SS, viewport={'width': 1366, 'height': 768})
    check('معطل سبسکرپشن: پورا تالا (پہلے جیسا)', DS_['pg'].evaluate("!!document.getElementById('dio-sub-lock')"))
    DS_['ctx'].close(); devices.remove(DS_)

    # ═══ B, C, D) فعال سبسکرپشن، دو آلات، ایک سرور ═══
    S = DB(); seed(S)
    D = device('desktop', S, viewport={'width': 1366, 'height': 768})
    M = device('mobile', S, viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, user_agent=MOBILE_UA)
    dp, mp = D['pg'], M['pg']
    for d in (D, M):
        wait_until(d['pg'], "() => DIOSync.state().realtime === 'SUBSCRIBED'", timeout=10)
    # اوپر کی پٹی کا لفظ موبائل پر بھی نظر آئے (پہلے صرف رنگین نقطہ)
    for d in (D, M):
        t = wait_until(d['pg'], "() => document.getElementById('status-text').textContent === 'محفوظ'", timeout=10)
        vis = d['pg'].evaluate("""() => { const t = document.getElementById('status-text'), r = t.getBoundingClientRect(), h = document.querySelector('.topbar').getBoundingClientRect();
          return { w: Math.round(r.width), inBar: r.top >= h.top && r.bottom <= h.bottom + 1 && r.left >= 0 && r.right <= innerWidth, disp: getComputedStyle(t).display }; }""")
        check(f"[{d['label']}] اوپر کی پٹی پر لفظ «محفوظ» نظر آتا ہے (پٹی کے اندر)", t is not None and vis['w'] > 10 and vis['inBar'] and vis['disp'] != 'none', vis)
    mp.screenshot(path=f'{OUT}/v561_mobile_00_status_word.png', clip={'x': 0, 'y': 0, 'width': 390, 'height': 60})

    # B) SHO / DSP کا نام
    dp.evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(dp, 800)
    seeded = [x for x in S.t['dio_user_data'] if x['kind'] == 'setting' and x['doc_key'] == 'setting|digital_io_sho']
    check('SHO: اس آلے پر پہلے سے لکھا نام سرور پر (پہلی بار، ایک ہی قطار)', len(seeded) == 1 and 'ندیم عباس شاد' in (seeded[0]['data'] or {}).get('value', ''), seeded[:1])
    dp.evaluate("openShoDspModal('sho')"); idle(dp, 400)
    dp.select_option('#shodsp-rank', 'I/SHO'); dp.fill('#shodsp-name', 'محمد اکرم بھٹی')
    dp.evaluate("_saveShoDsp('sho')"); idle(dp, 2600)
    row = [x for x in S.t['dio_user_data'] if x['doc_key'] == 'setting|digital_io_sho']
    check('SHO: لیپ ٹاپ پر بدلا → سرور پر نیا نام (اسی قطار میں)', len(row) == 1 and 'محمد اکرم بھٹی' in row[0]['data']['value'], [r['data'] for r in row])
    t = wait_until(mp, "() => (JSON.parse(localStorage.getItem('digital_io_sho')||'{}').name === 'محمد اکرم بھٹی')", timeout=10)
    check('SHO: موبائل پر 10 سیکنڈ میں، بغیر refresh', t is not None, f'{t}s')
    check('SHO: موبائل پر رپورٹوں والا نام بھی نیا (getSHOName)', mp.evaluate("getSHOName()") == 'I/SHO محمد اکرم بھٹی', mp.evaluate("getSHOName()"))
    mp.evaluate("openShoDspModal('dsp')"); idle(mp, 400)
    mp.select_option('#shodsp-rank', 'SDPO'); mp.fill('#shodsp-name', 'رانا عمران')
    mp.evaluate("_saveShoDsp('dsp')"); idle(mp, 2600)
    t = wait_until(dp, "() => getDSPName() === 'SDPO رانا عمران'", timeout=10)
    check('DSP/SDPO: موبائل پر بدلا → لیپ ٹاپ پر 10 سیکنڈ میں', t is not None, dp.evaluate("getDSPName()"))
    # نیا آلہ (کبھی کھلا نہیں) — کھلتے ہی سرور والا نام
    N = device('mobile-new', S, viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, user_agent=MOBILE_UA)
    N['pg'].evaluate("async () => { await DIOSync.kick(true); return 0; }"); idle(N['pg'], 800)
    check('SHO: نیا آلہ — کھلتے ہی وہی نام (اپنا پرانا نام سرور پر نہیں چڑھاتا)', N['pg'].evaluate("getSHOName()") == 'I/SHO محمد اکرم بھٹی' and 'محمد اکرم بھٹی' in [x for x in S.t['dio_user_data'] if x['doc_key'] == 'setting|digital_io_sho'][0]['data']['value'],
          N['pg'].evaluate("getSHOName()"))
    N['ctx'].close(); devices.remove(N)

    # C) مقدمہ شیئر ختم
    n0 = len(S.log)
    mp.evaluate("showPage('cases', null)"); idle(mp, 1800)
    mp.evaluate("async () => { if (typeof _refreshCasesInBackground === 'function') await _refreshCasesInBackground(currentOfficer.id); return 0; }"); idle(mp, 1500)
    cs = mp.evaluate("(document.getElementById('cs-rows')||{innerText:''}).innerText.replace(/\\s+/g, '')")
    check('شیئر ختم: دوسرے افسر کا (پہلے شیئر کیا) مقدمہ فہرست میں نہیں', '681/26' in cs and '999/26' not in cs, cs[:80])
    check('شیئر ختم: case_shares سے کچھ نہیں منگوایا گیا', not [x for x in S.log[n0:] if x[0] == 'case_shares'], [x for x in S.log[n0:] if x[0] == 'case_shares'][:2])
    S.events.append({'table': 'cases', 'eventType': 'UPDATE', 'new': dict(S.t['cases'][1], rev=2), 'old': {'id': CX}})
    idle(mp, 800)
    check('شیئر ختم: realtime سے آیا دوسرے افسر کا مقدمہ آلے پر محفوظ نہیں ہوا', mp.evaluate("async (id) => !(await offlineStore.getOne('cases_cache', id))", CX))
    check('شیئر ختم: «شیئرڈ» نشان کہیں نہیں', 'شیئرڈ' not in mp.evaluate("document.body.innerText"))

    # D) گشت باہر
    for d in (D, M):
        pg = d['pg']; tag = f"[{d['label']}] گشت"
        pg.evaluate("showPage('dashboard', null)"); idle(pg, 1200)
        check(f'{tag}: Dashboard پر «گشت لاگ» نہیں', 'گشت' not in pg.evaluate("document.getElementById('page-content').innerText"))
        pg.evaluate("DIOEntry.hub()"); idle(pg, 500)
        hub = pg.evaluate("(document.getElementById('modal-body')||{innerText:''}).innerText")
        check(f'{tag}: «نیا اندراج» میں گشت نہیں (باقی سب موجود)', 'گشت' not in hub and 'واقعاتی رپورٹ' in hub and 'مقدمہ' in hub, hub[:120])
        pg.evaluate("try{closeModal()}catch(e){}")
        pg.evaluate("showPage('gasht', null)"); idle(pg, 1200)
        check(f'{tag}: پرانا راستہ (#gasht) کچھ نہیں کھولتا', 'گشت' not in pg.evaluate("(document.getElementById('topbar-title')||{textContent:''}).textContent") and not pg.evaluate("!!document.getElementById('gl-doc')"))
        pg.evaluate("showPage('templates', null)"); idle(pg, 1800)
        check(f'{tag}: ٹمپلیٹس میں «گشت رپورٹ» نہیں', not any(f['id'] == 'gasht' for f in pg.evaluate("window.DIO_SYSTEM_FORMS || []")) and 'گشت رپورٹ' not in pg.evaluate("document.getElementById('page-content').innerText"))
    dp.screenshot(path=f'{OUT}/v561_desktop_03_dashboard_no_gasht.png'); mp.screenshot(path=f'{OUT}/v561_mobile_03_templates.png')
    for d in (D, M):
        bad = [e for e in d['errs'] if 'ResizeObserver' not in e]
        check(f"[{d['label']}] صفحے پر کوئی JS غلطی نہیں", not bad, bad[:3])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
