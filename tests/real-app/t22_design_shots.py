"""(TASK 22) ڈیزائن کی تصاویر — نمونہ (t22_design/shell.html) کے اندر اصل Digital IO (فریم میں، آزمائشی ڈیٹا)
Desktop 1366×768 + Mobile 390×844۔ یہ کام کرنے والا کوڈ نہیں — صرف منظوری کے لیے شکل۔
چلانا: python3 t22_design_shots.py"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v564_common import *

V = OUT + '/t22/design/'
os.makedirs(V, exist_ok=True)
SHELL = BASE + 'tests/real-app/t22_design/shell.html'
TXT = ' '.join(PARA[:2])
LOGIN = """async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }"""
# ضم شدہ «واپس»: فریم کے اندر کے تینوں «واپس» بٹن اب اوپر کی پٹی میں ایک ہی جگہ (تجویز)
HIDE = """(() => { const s = document.createElement('style'); s.textContent = '#dio-back-btn,.dio-backbtn,#dio-dv-tabs{display:none !important}'; document.head.appendChild(s); return 0; })()"""
FIR = """(() => { const d = window.__db; d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'میں مدعی مقدمہ ہوں اور بیرون دہلی گیٹ ملتان کا رہائشی ہوں۔ مورخہ 08/10/2026 کو بوقت قریب 9 بجے شب میں اپنے موٹر سائیکل پر سوار ہو کر بازار سے گھر واپس آ رہا تھا کہ دو نامعلوم ملزمان نے اسلحہ کے زور پر میرا موبائل فون اور نقدی چھین لی۔', created_at:'2026-10-08' }]; return 0; })()"""

TABS_D = [
    {'t': 'ڈیش بورڈ', 'ic': 'home', 'path': 'ڈیش بورڈ'},
    {'t': 'ضمنی', 'n': '663/26', 'on': True, 'dirty': True, 'path': 'مقدمہ 663/26 › ضمنیات › نئی ضمنی'},
    {'t': 'ایف آئی آر', 'n': '663/26', 'path': 'مقدمہ 663/26 › ایف آئی آر'},
    {'t': 'چالان مکمل', 'n': '701/26', 'path': 'مقدمہ 701/26 › رپورٹ 173 › چالان مکمل'},
    {'t': 'میرے مقدمات', 'ic': 'fold', 'path': 'میرے مقدمات'},
]


def frame(pg, fid):
    for _ in range(100):
        el = pg.query_selector('#' + fid)
        f = el.content_frame() if el else None
        if f and f.url.endswith('dtab=' + fid[1:]):
            try:
                if f.evaluate("typeof loginSuccess === 'function' && document.readyState === 'complete'"): return f
            except Exception: pass
        pg.wait_for_timeout(100)
    raise RuntimeError('frame ' + fid)


def boot(pg, fid):
    f = frame(pg, fid)
    pg.wait_for_timeout(1500)
    f.evaluate(LOGIN); pg.wait_for_timeout(2500)
    f.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}; 0")
    f.evaluate("window.confirm = () => true; 0")
    f.evaluate(HIDE); f.evaluate(SEED); f.evaluate(FIR)
    return f


def zimni(pg, f):
    open_zimni(f)
    f.evaluate("""(t) => { const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus();
      const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.execCommand('insertText', false, t); return 0; }""", TXT)
    pg.wait_for_timeout(800)


def fir(pg, f):
    f.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    f.evaluate("_dioOpenDocTab('fir'); _dioRenderTabContent('fir'); 0"); pg.wait_for_timeout(1800)


def shell(b, mobile, cfg):
    vp = {'width': 390, 'height': 844} if mobile else {'width': 1366, 'height': 768}
    extra = {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2} if mobile else {'device_scale_factor': 2}
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', viewport=vp, **extra)
    ctx.route('**/*', route)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
    pg = ctx.new_page()
    pg.goto(SHELL); pg.wait_for_timeout(400)
    pg.evaluate("(c) => mockSetup(c)", cfg)
    return ctx, pg


def snap(pg, name):
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
    pg.screenshot(path=V + name + '.png')
    print('saved', name, flush=True)


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        # D1 — ڈیسک ٹاپ: پیچھے/آگے دائیں کونے میں (تجویز کردہ، RTL)
        ctx, pg = shell(b, False, {'tabs': TABS_D, 'navSide': 'right', 'fwdOff': False})
        f = boot(pg, 'f1'); zimni(pg, f); snap(pg, 'D1_desktop_tabs_nav_right'); ctx.close()
        # D2 — ڈیسک ٹاپ: پیچھے/آگے بائیں کونے میں (Chrome جیسا، LTR)
        ctx, pg = shell(b, False, {'tabs': TABS_D, 'navSide': 'left', 'fwdOff': False})
        f = boot(pg, 'f1'); zimni(pg, f); snap(pg, 'D2_desktop_tabs_nav_left'); ctx.close()
        # D3 — ڈیسک ٹاپ: ساتھ ساتھ (دو ٹیبیں)
        tabs = [dict(t) for t in TABS_D]; tabs[2]['split2'] = True
        ctx, pg = shell(b, False, {'tabs': tabs, 'navSide': 'right', 'split': ['ضمنی · مقدمہ 663/26 (فعال)', 'ایف آئی آر · مقدمہ 663/26']})
        f1 = boot(pg, 'f1'); f2 = boot(pg, 'f2'); zimni(pg, f1); fir(pg, f2); snap(pg, 'D3_desktop_split_view'); ctx.close()
        # D4 — ڈیسک ٹاپ: ڈیش بورڈ پر «واپس» / Alt+← → تصدیق
        ctx, pg = shell(b, False, {'tabs': [{'t': 'ڈیش بورڈ', 'ic': 'home', 'on': True}], 'navSide': 'right', 'fwdOff': True, 'exit': True})
        f = boot(pg, 'f1'); snap(pg, 'D4_desktop_exit_confirm'); ctx.close()
        # M1 — موبائل: اوپر کی پٹی
        tabs_m = [dict(t) for t in TABS_D[:4]]
        ctx, pg = shell(b, True, {'tabs': tabs_m, 'mobile': True})
        f = boot(pg, 'f1'); zimni(pg, f); snap(pg, 'M1_mobile_tab_bar'); ctx.close()
        # M2 — موبائل: ٹیبوں کی فہرست
        ctx, pg = shell(b, True, {'tabs': tabs_m, 'mobile': True, 'sheet': True})
        f = boot(pg, 'f1'); snap(pg, 'M2_mobile_tab_switcher'); ctx.close()
        # M3 — موبائل: Android «واپس» ڈیش بورڈ پر → تصدیق
        ctx, pg = shell(b, True, {'tabs': [{'t': 'ڈیش بورڈ', 'ic': 'home', 'on': True}], 'mobile': True, 'fwdOff': True, 'exit': True})
        f = boot(pg, 'f1'); snap(pg, 'M3_mobile_exit_confirm'); ctx.close()
        b.close()


if __name__ == '__main__':
    main()
