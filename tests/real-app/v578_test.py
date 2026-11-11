"""(v578) دستاویز ہمیشہ پورے صفحے اور «⋯» میں — چاہے ایپ کھلتے ہی مقدمہ اور دستاویز کھولی جائے۔

خرابی (GitHub CI پر پکڑی گئی، 11 نومبر 2026): doc-viewer.js (پورا صفحہ + «⋯» = محفوظ / پرنٹ / شیئر / واپس)
پس منظر میں باری پر آتی تھی۔ سست آلے پر مقدمہ اور دستاویز اس سے پہلے کھلیں تو دستاویز پورے صفحے کے بغیر کھلتی
اور «⋯» نہیں ہوتا — بیرونی ضمنی (v575) اور بیانات 161 (v577) میں اوپر کی پٹی بھی نہیں، تو موبائل پر محفوظ / پرنٹ کا
کوئی بٹن ہی نہیں۔ یہاں doc-viewer.js کو جان بوجھ کر شروع میں نہیں آنے دیا جاتا (سست آلے جیسی حالت)، پھر مقدمہ کھلتا ہے۔
چلانا: `python3 v578_test.py` (سرور: repo کی جڑ میں `python3 -m http.server 8770`)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import real
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:300] if extra != '' else ''), flush=True)

SRC = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v558_test.py'), encoding='utf-8').read()
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'
exec(SRC[SRC.index('SEED = """'):SRC.index('HOOK = """')])
DESK = {'width': 1366, 'height': 768}
MOB = {'width': 390, 'height': 844}
MOBX = {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}


def slow_app(b, viewport, mode, **extra):
    """open_app جیسا — مگر doc-viewer.js شروع میں نہیں آتی:
       mode='slow'  — پس منظر کی باری ابھی پیچھے (report173.js جیسی بڑی فائل سست آ رہی ہے، doc-viewer.js کی باری
                      ابھی نہیں آئی) — CI پر یہی ہوا: مقدمہ کا صفحہ تیار، doc-viewer.js نہیں
       mode='fail'  — doc-viewer.js کی پہلی کوشش ناکام (نیٹ کی خرابی)؛ بعد کی کوشش ملنی چاہیے"""
    state = {'block': True, 'held': [], 'mode': mode}
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', viewport=viewport, **extra)
    def rt(r):
        u = r.request.url.split('?')[0]
        if state['block'] and mode == 'fail' and u.endswith('/doc-viewer.js'): return r.abort()
        if state['block'] and mode == 'slow' and u.endswith('/report173.js'):
            state['held'].append(r); return None            # جواب بعد میں (نیچے)
        return real.route(r)
    ctx.route('**/*', rt)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500)
    pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    return ctx, pg, errs, state


def run(b, tag, desktop, mode):
    ctx, pg, errs, st = slow_app(b, DESK if desktop else MOB, mode, **({} if desktop else MOBX))
    tag = f'{tag} ({"سست فائل" if mode == "slow" else "پہلی کوشش ناکام"})'
    pg.evaluate(SEED)
    pre = pg.evaluate("typeof _dioOpenDocTab")
    check(f'{tag}: (حالت) ایپ کھلی ہے مگر doc-viewer.js ابھی نہیں آئی', pre == 'undefined', pre)
    st['block'] = False
    # افسر: مقدمہ کھولا؛ جیسے ہی مقدمے کا صفحہ (چِپیں) سامنے آئے — کیا پورا صفحہ / «⋯» والی فائل تیار ہے؟
    pg.evaluate("window.__ws = openCaseWorkspace('c1').then(() => typeof _dioOpenDocTab); 0"); pg.wait_for_timeout(800)
    for r in st['held']: real.route(r)        # سست فائل اب پہنچی
    ready = pg.evaluate("window.__ws")
    check(f'{tag}: مقدمے کا صفحہ کھلتے وقت doc-viewer.js تیار (چِپ دبانے سے پہلے پورا صفحہ / «⋯»)', ready == 'function', ready)
    pg.wait_for_timeout(800); pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(2000)
    pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
    g = pg.evaluate("""({ dv: !!document.getElementById('dio-docview'), fab: !!(document.getElementById('dio-dv-fab') || {getClientRects: () => []}).getClientRects().length,
        inDv: !!document.querySelector('#dio-dv-body #ch173-doc .zfa-tbl'), pick: !!document.getElementById('zfa-cp-wit') })""")
    check(f'{tag}: مقدمہ کھلتے ہی doc-viewer.js آ گئی؛ بیان 161 پورے صفحے میں، نیچے کونے میں «⋯»، کاغذ کے کونے میں «▾»',
          g['dv'] and g['fab'] and g['inDv'] and g['pick'], g)
    za_pick(pg, 'مدعی', 1400)
    za_save(pg); pg.wait_for_timeout(2000)
    n = pg.evaluate("(window.__db.zimni_androoni_reports||[]).filter(r => r.case_id === 'c1').length")
    check(f'{tag}: «⋯ → محفوظ کریں» — بیان سرور پر', n == 1, n)
    # بیرونی ضمنی — اسی طرح
    pg.evaluate("_dioExitDocView && _dioExitDocView(); 0"); pg.wait_for_timeout(800)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(600)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
    g2 = pg.evaluate("({ dv: !!document.getElementById('dio-docview'), fab: !!document.getElementById('dio-dv-fab') })")
    check(f'{tag}: ضمنیات بھی پورے صفحے میں «⋯» کے ساتھ', g2['dv'] and g2['fab'], g2)
    real_errs = [e for e in errs if 'ResizeObserver' not in e]
    check(f'{tag}: کوئی JavaScript خرابی نہیں', not real_errs, real_errs[:3])
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch()
    for mode in ('slow', 'fail'):
        run(b, 'Desktop', True, mode)
        run(b, 'Mobile', False, mode)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
