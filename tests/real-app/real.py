"""Drive the REAL Digital IO app (index.html + every real script/CSS) — only Supabase is a test double."""
import os, sys, json, subprocess, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('DIO_OUT', HERE + '/out'); os.makedirs(OUT, exist_ok=True)
# fonts: npm pack @fontsource/noto-nastaliq-urdu → files/ ; DOMPurify: npm pack dompurify@3.1.6 → dist/
FONTS = os.environ.get('DIO_FONTS', HERE + '/.deps/fontpkg/package/files/')
PURIFY = os.environ.get('DIO_PURIFY', HERE + '/.deps/purify/package/dist/purify.min.js')
# نقشہ موقع کی ڈرائنگ لائبریری (ایپ cdnjs سے fabric 5.3.0 لیتی ہے): npm pack fabric@5.3.0 → package/dist/
FABRIC = os.environ.get('DIO_FABRIC', HERE + '/.deps/fabric/package/dist/fabric.min.js')
# موبائل پر PDF (FIR کی نقل) دکھانے والی لائبریری — npm pack pdfjs-dist@3.11.174 → package/build/
PDFJS = os.environ.get('DIO_PDFJS', HERE + '/.deps/pdfjs/package/build/')
# اصل ایپ کا اردو فونٹ: index.html «Jameel Noori Nastaleeq» jsdelivr (npm: jameel-noori) سے لیتی ہے —
# افسر کے آلے پر کاغذ اسی فونٹ میں بنتا ہے، اس لیے جانچ بھی اسی میں (npm pack jameel-noori → package/fonts/)۔
JAMEEL = os.environ.get('DIO_JAMEEL', HERE + '/.deps/jameel/package/fonts/jameel-noori-nastaleeq4.woff2')
HAS_JAMEEL = os.path.exists(JAMEEL)
BASE = 'http://localhost:8770/'
FONT_CSS = """@font-face{font-family:'Noto Nastaliq Urdu';src:url(https://fonts.gstatic.com/n400.woff2) format('woff2');font-weight:400}
@font-face{font-family:'Noto Nastaliq Urdu';src:url(https://fonts.gstatic.com/n700.woff2) format('woff2');font-weight:700}"""
if not HAS_JAMEEL:   # Jameel نہ ہو تو پرانا طریقہ: اسی نام سے Noto
    FONT_CSS += """
@font-face{font-family:'Jameel Noori Nastaleeq';src:url(https://fonts.gstatic.com/n400.woff2) format('woff2');font-weight:400}
@font-face{font-family:'Jameel Noori Nastaleeq';src:url(https://fonts.gstatic.com/n700.woff2) format('woff2');font-weight:700}"""
PRINT_HOOK = """window.__printCalls = 0;
window.print = function () { window.__printCalls++; window.dispatchEvent(new Event('beforeprint')); };"""

def route(r):
    u = r.request.url
    if 'supabase' in u and u.endswith('.js'):
        return r.fulfill(path=HERE + '/mock-supabase.js', content_type='application/javascript')
    if 'purify' in u: return r.fulfill(path=PURIFY, content_type='application/javascript')
    if 'pdf.js/3.11.174/' in u and (u.endswith('pdf.min.js') or u.endswith('pdf.worker.min.js')):
        f = PDFJS + ('pdf.worker.min.js' if u.endswith('pdf.worker.min.js') else 'pdf.min.js')
        return r.fulfill(path=f, content_type='application/javascript') if os.path.exists(f) else r.abort()
    if 'fabric' in u and u.endswith('.js'):
        return r.fulfill(path=FABRIC, content_type='application/javascript') if os.path.exists(FABRIC) else r.abort()
    if 'mammoth' in u: return r.fulfill(body='window.mammoth={};', content_type='application/javascript')
    if 'jameel-noori' in u and u.endswith('.woff2'):
        return r.fulfill(path=JAMEEL, content_type='font/woff2') if HAS_JAMEEL else r.abort()
    if 'fonts.googleapis.com' in u: return r.fulfill(body=FONT_CSS, content_type='text/css')
    if 'fonts.gstatic.com/n400' in u: return r.fulfill(path=FONTS + 'noto-nastaliq-urdu-arabic-400-normal.woff2', content_type='font/woff2')
    if 'fonts.gstatic.com/n700' in u: return r.fulfill(path=FONTS + 'noto-nastaliq-urdu-arabic-700-normal.woff2', content_type='font/woff2')
    if u.startswith(BASE): return r.continue_()
    return r.abort()

def open_app(b, **ctxargs):
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi',
                        geolocation={'latitude': 30.157458, 'longitude': 71.524918}, permissions=['geolocation'], **ctxargs)
    ctx.route('**/*', route)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500)
    pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.wait_for_timeout(300)
    pg.evaluate("document.fonts.ready")
    return ctx, pg, errs

def pdf(pg, name):
    """Exactly what the officer does: Ctrl+P (app routes it to its print), then the browser prints."""
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(300)
    calls = pg.evaluate('window.__printCalls')
    pg.pdf(path=f'{OUT}/{name}.pdf', prefer_css_page_size=True, print_background=True)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))")
    info = subprocess.run(['pdfinfo', f'{OUT}/{name}.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '90', '-singlefile', f'{OUT}/{name}.pdf', f'{OUT}/{name}'])
    return calls, info

if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
        pg.screenshot(path=OUT + '/00_dashboard.png')
        pg.evaluate("showPage('incident', null)"); pg.wait_for_timeout(1200)
        pg.screenshot(path=OUT + '/01_list.png')
        pg.click('.page-header .dio-add-btn'); pg.wait_for_selector('#ir-doc'); pg.wait_for_timeout(1500)
        pg.screenshot(path=OUT + '/02_doc.png')
        calls, info = pdf(pg, '03_print')
        print('print calls', calls); print(info)
        print('errors', errs[:8])
        b.close()
