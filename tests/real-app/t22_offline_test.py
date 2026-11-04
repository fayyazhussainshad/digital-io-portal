"""(TASK 22) انٹرنیٹ کے بغیر نئی ٹیب — service worker کے قابو میں (اصل استعمال جیسا)
اصل ایپ اپنے سرور سے (service worker چالو)؛ Supabase کی لائبریری آن لائن ہوتے وقت آزمائشی فائل سے، آف لائن ہوتے ہی ناکام۔
  1) آف لائن: نئی ٹیب کی نقل (index.html?dtab=…) کیش سے کھلتی ہے — براؤزر کا خرابی والا صفحہ نہیں
  2) ٹیب کو CDN کی لائبریری نہ ملے تب بھی «کنکشن کا مسئلہ» نہیں — اوپر کی کھڑکی کی لائبریری استعمال (Desktop 1366×768 + Mobile 390×844)
چلانا: `python3 t22_offline_test.py`
"""
import os, sys, json, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MOCK = os.path.join(HERE, 'mock-supabase.js')
OUT = os.path.join(HERE, 'out', 't22', 'offline')
os.makedirs(OUT, exist_ok=True)
PORT = 8794

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(s, *a): pass


socketserver.ThreadingTCPServer.allow_reuse_address = True
srv = socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Q); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = f'http://127.0.0.1:{PORT}/'

PROBE = """(() => { const f = document.getElementById('probe'); if (!f) return null; const w = f.contentWindow;
  return { q: w.location.search, child: w.__dioTabChild || null, ready: w.document.readyState,
           login: !!w.document.getElementById('login-screen'), app: !!w.document.getElementById('main-app'),
           connErr: /کنکشن کا مسئلہ/.test(w.document.body ? w.document.body.innerText : ''), lib: !!(w.supabase && w.supabase.createClient) }; })()"""


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    kw = {'viewport': {'width': 1366, 'height': 768}} if desktop else {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(timezone_id='Asia/Karachi', **kw)
        st = {'off': False}
        def cdn(r):
            u = r.request.url
            if 'supabase' in u and u.endswith('.js') and not st['off']:
                return r.fulfill(path=MOCK, content_type='application/javascript', headers={'Access-Control-Allow-Origin': '*'})
            return r.abort('internetdisconnected')
        ctx.route(lambda u: u.startswith('https://'), cdn)   # باہر کا ہر رابطہ: آن لائن میں صرف لائبریری، آف لائن میں کچھ نہیں
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(B + 'index.html')

        def ev(js, arg=None):
            for _ in range(40):
                try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
                except Exception: pg.wait_for_timeout(500)   # service worker قابو لیتے ہی صفحہ ایک بار خود تازہ ہوتا ہے
            return None
        for _ in range(60):
            if ev("!!navigator.serviceWorker.controller"): break
            pg.wait_for_timeout(500)
        pg.wait_for_timeout(5000)
        ctl = ev("!!navigator.serviceWorker.controller")
        host_lib = ev("!!(window.supabase && window.supabase.createClient) && document.body.classList.length >= 0")
        check(f'{tag} service worker صفحے کے قابو میں، اوپر کی کھڑکی کے پاس لائبریری', bool(ctl and host_lib), [ctl, host_lib])

        ctx.set_offline(True); st['off'] = True
        ev("(() => { const f = document.createElement('iframe'); f.id = 'probe'; f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff'; f.src = 'index.html?dtab=offline1'; document.body.appendChild(f); return 1; })()")
        info = None
        for _ in range(30):
            pg.wait_for_timeout(500)
            info = ev(PROBE)
            if info and info['ready'] == 'complete' and (info['login'] or info['connErr']): break
        pg.wait_for_timeout(3200)                             # «کنکشن کا مسئلہ» 2.5 سیکنڈ بعد آتا — انتظار کر کے دیکھو
        info = ev(PROBE)
        check(f'{tag} آف لائن: نئی ٹیب کی نقل service worker کے کیش سے کھلی (براؤزر کا خرابی والا صفحہ نہیں)',
              bool(info and info['q'] == '?dtab=offline1' and info['child'] == 'offline1' and info['app']), info)
        check(f'{tag} آف لائن: ٹیب نے اوپر کی کھڑکی کی لائبریری لی — «کنکشن کا مسئلہ» نہیں',
              bool(info and info['lib'] and info['login'] and not info['connErr']), info)
        pg.screenshot(path=os.path.join(OUT, tag + '_offline_tab_copy.png'))
        e2 = [e for e in errs if 'ResizeObserver' not in e]
        check(f'{tag} کوئی JS خرابی نہیں', not e2, e2[:3])
        b.close()


only = os.environ.get('DIO_ONLY', '')
if only in ('', 'desktop'): run(True)
if only in ('', 'mobile'): run(False)
srv.shutdown()
fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
json.dump(R, open(os.path.join(OUT, 'results.json'), 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
