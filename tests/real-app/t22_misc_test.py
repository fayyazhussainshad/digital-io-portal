"""(TASK 22) ٹیبوں کے ساتھ حفاظت کے اصول — اصل ایپ، ایک سرور (mock_db_engine.py):
  • سبسکرپشن ختم = ہر ٹیب میں صرف دیکھنا (لکھائی / پرنٹ بند، براؤزر کی چھپائی میں بھی)
  • PIN تالا: پوری Digital IO کھڑکی (سب ٹیبیں) ڈھک جاتی ہے؛ ٹیب کے اندر الگ تالا نہیں
  • ٹیب کے اندر سے لاگ آؤٹ = پورا Digital IO؛ کھلی ٹیبوں کی فہرست مٹ جاتی ہے
  • ایک آلہ دو افسر: ایک کی کھلی ٹیبیں دوسرے کو نظر نہیں آتیں
Desktop 1366×768 + Mobile 390×844۔ چلانا: `python3 t22_misc_test.py`
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import route as real_route, PRINT_HOOK, TABS_FORCE, BASE, OUT, tabs_ctx
from mock_db_engine import DB
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = HERE + '/mock-supabase-shared.js'
CA = '1a7e0c4e-0000-4000-8000-0000000006a1'
V = OUT + '/t22/misc/'
os.makedirs(V, exist_ok=True)
R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:300] if extra != '' else ''), flush=True)

def seed(S, sub='active', exp='2027-12-31T00:00:00Z'):
    t = '2026-10-08T00:00:00Z'
    S.t['officers'] = [
        {'id': 'o1', 'user_id': 'u1', 'email': 'io@test.pk', 'full_name': 'فیاض حسین شاد', 'designation': 'ASI', 'station': 'صدر ملتان', 'district': 'ملتان', 'role': 'officer', 'is_approved': True, 'suspended': False, 'created_at': '2026-01-01T00:00:00Z'},
        {'id': 'o2', 'user_id': 'u2', 'email': 'io2@test.pk', 'full_name': 'محمد اکرم', 'designation': 'SI', 'station': 'صدر ملتان', 'district': 'ملتان', 'role': 'officer', 'is_approved': True, 'suspended': False, 'created_at': '2026-01-01T00:00:00Z'}]
    S.t['subscriptions'] = [{'id': 's1', 'officer_id': 'o1', 'status': sub, 'start_date': '2026-01-01', 'end_date': exp[:10], 'expires_at': exp, 'created_at': '2026-01-01T00:00:00Z', 'subscription_plans': {'name': 'سالانہ', 'duration_days': 365}},
                            {'id': 's2', 'officer_id': 'o2', 'status': 'active', 'start_date': '2026-01-01', 'end_date': '2027-12-31', 'expires_at': '2027-12-31T00:00:00Z', 'created_at': '2026-01-01T00:00:00Z', 'subscription_plans': {'name': 'سالانہ', 'duration_days': 365}}]
    S.t['cases'] = [{'id': CA, 'officer_id': 'o1', 'fir_number': '681/26', 'section_of_law': '380 ت پ', 'occurrence_date': '2026-10-08', 'status': 'under',
                     'complainant': 'ملک زاہد اقبال ولد فیض احمد', 'created_at': t, 'updated_at': t, 'rev': 1, 'deleted_at': None}]
    for k in ('zimni_reports', 'zimni_androoni_reports', 'report_173', 'dio_user_data', 'recycle_bin', 'incident_reports', 'case_witnesses', 'case_accused'): S.t[k] = []
    S.t['fir_matn'] = [{'id': 'm1', 'case_id': CA, 'type': 'fir', 'matn': 'میں مدعی مقدمہ ہوں۔', 'created_at': '2026-10-01'}]
    S.t['zimni_reports'] = [{'id': 'z1', 'case_id': CA, 'officer_id': 'o1', 'serial_no': 1, 'report_date': '2026-10-16', 'rev': 1, 'deleted_at': None,
                             'content': {'bodyHtml': '', 'head': 'رپورٹ ضمنی', 'serial_no': 1, 'saved_at': '2026-10-16T10:00:00Z'}, 'created_at': '2026-10-16T10:00:00Z'}]

ACTIVE = """() => { try { const S = DIOTabs._state(); const t = S.tabs.find(x => x.id === S.active); const e = t && t.entries[t.idx];
  const r = e && S.frames[e.fid]; return (r && r.win && r.win.DIOTabsChild && r.win.DIOTabsChild.ready && !t.loading && !e.pending) ? e.fid : null; } catch (_) { return null; } }"""

with sync_playwright() as p:
    b = p.chromium.launch()

    def run(desktop):
        tag = 'desktop' if desktop else 'mobile'
        S = DB(); seed(S, 'expired', '2026-10-01T00:00:00Z')
        kw = {'viewport': {'width': 1366, 'height': 768}} if desktop else {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx = tabs_ctx(b.new_context(service_workers='block', timezone_id='Asia/Karachi', **kw))
        ctx.route('**/*', lambda r: r.fulfill(path=SHARED, content_type='application/javascript') if ('supabase' in r.request.url and r.request.url.endswith('.js')) else real_route(r))
        ctx.expose_binding('__srv', lambda source, st: S.exec(st))
        ctx.add_init_script(TABS_FORCE + PRINT_HOOK + "\nwindow.confirm = () => true;")
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: d.accept())

        def idle(ms):
            end = time.time() + ms / 1000.0
            while time.time() < end:
                evts = S.take_events()
                if evts:
                    try: pg.evaluate('e => window.__rtDeliver ? __rtDeliver(e) : 0', evts)
                    except Exception: pass
                pg.wait_for_timeout(150)

        def af():
            for _ in range(200):
                fid = pg.evaluate(ACTIVE)
                if fid:
                    for f in pg.frames:
                        if f.name == 'dio-tab-' + fid: return f
                idle(150)
            raise RuntimeError('tab not ready')

        def login(uid, email):
            pg.evaluate("""async ([u, m]) => { currentUser = {id: u, email: m, user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""", [uid, email])
            idle(1500); af(); idle(800)
            pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); idle(300)

        pg.goto(BASE + 'index.html'); idle(2500)
        login('u1', 'io@test.pk')
        # ═══ سبسکرپشن ختم — ٹیب کے اندر صرف دیکھنا ═══
        f = af()
        ok_vo = False
        for _ in range(60):
            if f.evaluate("document.documentElement.classList.contains('dio-viewonly')"): ok_vo = True; break
            idle(200)
        check(f'{tag} 18) سبسکرپشن ختم: ٹیب میں «صرف دیکھنا»', ok_vo, f.evaluate("(document.getElementById('status-text') || {}).textContent"))
        f.evaluate("c => openCaseWorkspace(c)", CA); idle(1500); f = af()
        f.evaluate("_openMisalEditor('zamniyat'); 0"); idle(2500); f = af()
        n_rows = f.evaluate("document.querySelectorAll('.zt tbody tr[data-zid]').length")
        check(f'{tag} 18) صرف دیکھنا: پڑھنا کھلا (ضمنیات کی فہرست ٹیب میں)', n_rows == 1, n_rows)
        f.evaluate("_openZimni('z1'); 0"); idle(2500); f = af()
        before = f.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); return e ? e.innerText : null; })()")
        try:
            f.click('#ch173-doc tr.zf-blk .zf-body', timeout=4000); pg.keyboard.type('لکھائی کی کوشش')
        except Exception: pass
        idle(500)
        after = f.evaluate("(() => { const e = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); return e ? e.innerText : null; })()")
        calls0 = f.evaluate("window.__printCalls")
        try: pg.keyboard.press('Control+p')
        except Exception: pass
        idle(800)
        calls1 = f.evaluate("window.__printCalls")
        check(f'{tag} 18) صرف دیکھنا: ٹیب میں لکھائی بند، Ctrl+P سے پرنٹ نہیں', before == after and calls1 == calls0, [before == after, calls0, calls1])
        pg.evaluate("window.dispatchEvent(new Event('beforeprint')); 0"); idle(200)
        vo_print = pg.evaluate("[document.documentElement.classList.contains('dio-viewonly'), !!document.getElementById('dio-pp-host'), !!document.getElementById('dio-nprint-host')]")
        pg.evaluate("window.dispatchEvent(new Event('afterprint')); 0")
        check(f'{tag} 18) صرف دیکھنا: براؤزر کے مینو کی چھپائی میں بھی دستاویز نہیں (صرف پیغام)', vo_print == [True, False, False], vo_print)
        writes = [x for x in S.t.get('zimni_reports', []) if x.get('rev', 1) > 1]
        check(f'{tag} 18) صرف دیکھنا: سرور پر کوئی لکھائی نہیں', not writes, len(writes))

        # ═══ PIN تالا: پوری کھڑکی ═══
        pg.evaluate("localStorage.setItem('digital_io_pin_hash', 'x'); lockApp(); 0"); idle(500)
        lock = pg.evaluate("(() => { const o = document.getElementById('pin-lock-overlay'); if (!o) return null; const r = o.getBoundingClientRect(); return [r.width, r.height, +getComputedStyle(o).zIndex]; })()")
        inner = af().evaluate("!!document.getElementById('pin-lock-overlay')")
        check(f'{tag} PIN تالا: اوپر کی کھڑکی پر پورا پردہ (سب ٹیبیں ڈھک گئیں)، ٹیب کے اندر الگ تالا نہیں',
              lock and lock[0] >= (1366 if desktop else 390) - 1 and lock[2] > 1000 and not inner, [lock, inner])
        pg.screenshot(path=V + tag + '_pin_lock_over_tabs.png')
        pg.evaluate("document.getElementById('pin-lock-overlay').remove(); localStorage.removeItem('digital_io_pin_hash'); 0")
        af().evaluate("document.dispatchEvent(new Event('visibilitychange')); lockApp(); 0"); idle(300)
        check(f'{tag} PIN تالا: ٹیب خود تالا نہیں لگاتی', not af().evaluate("!!document.getElementById('pin-lock-overlay')"))

        # ═══ 11) آخری ٹیب بند → ایک ڈیش بورڈ ٹیب ═══
        for _ in range(2): pg.click('#dio-tabs-strip [data-act="new"]'); idle(800); af()
        for _ in range(4):
            n = pg.evaluate("DIOTabs._state().tabs.length")
            pg.evaluate("DIOTabs.close(); 0"); idle(700)
        T = pg.evaluate("DIOTabs._state().tabs.map(t => t.entries[t.idx].t)")
        af()
        check(f'{tag} 11) سب ٹیبیں بند → ایک ڈیش بورڈ ٹیب (Digital IO بند نہیں)', T == ['ڈیش بورڈ'] and af().evaluate("window._activePage") == 'dashboard', T)
        # ═══ دو ٹیبیں → محفوظ فہرست؛ ٹیب کے اندر سے لاگ آؤٹ ═══
        pg.click('#dio-tabs-strip [data-act="new"]'); idle(800); af()
        key1 = pg.evaluate("Object.keys(localStorage).filter(k => k.startsWith('dio_tabs_v1_'))")
        try: af().evaluate("setTimeout(() => doLogout(), 0); 0")      # ٹیب کے اپنے اوپر کی پٹی والا لاگ آؤٹ
        except Exception: pass
        idle(3000)
        st = pg.evaluate("[getComputedStyle(document.getElementById('login-screen')).display, document.body.classList.contains('dio-tabs-on'), document.querySelectorAll('#dio-tabs-stage iframe').length, Object.keys(localStorage).filter(k => k.startsWith('dio_tabs_v1_'))]")
        check(f'{tag} ٹیب کے اندر سے لاگ آؤٹ = پورا Digital IO (لاگ اِن صفحہ، ٹیبیں بند، فہرست مٹ گئی)',
              key1 == ['dio_tabs_v1_o1'] and st[0] != 'none' and not st[1] and st[2] <= 1 and st[3] == [], [key1, st])
        pg.screenshot(path=V + tag + '_after_logout.png')
        # ═══ دوسرا افسر اسی آلے پر ═══
        login('u2', 'io2@test.pk')
        T = pg.evaluate("DIOTabs._state().tabs.map(t => t.entries[t.idx].t)")
        who = af().evaluate("currentOfficer && currentOfficer.full_name")
        check(f'{tag} دوسرا افسر: صرف ایک ڈیش بورڈ ٹیب (پہلے افسر کی ٹیبیں نہیں)، اپنے نام سے', T == ['ڈیش بورڈ'] and who == 'محمد اکرم', [T, who])
        e2 = [e for e in errs if 'ResizeObserver' not in e]
        check(f'{tag} کوئی JS خرابی نہیں', not e2, e2[:3])
        ctx.close()

    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(True)
    if only in ('', 'mobile'): run(False)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
json.dump(R, open(V + 'results.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
