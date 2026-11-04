"""(TASK 22) بغیر Playwright — سادہ Chromium کھڑکی (جیسے افسر کھولتا ہے)، اصل X11 کی بورڈ/ماؤس (xdotool)،
کھڑکی کا X = window manager کی «بند کرو» درخواست (wmctrl -c، openbox)۔ صفحہ ہر واقعہ سرور کو بھیجتا ہے (/log)۔
Playwright کا اپنا dialog سنبھالنا بیچ میں نہیں آتا — جو اسکرین پر آئے وہی تصویر میں۔
چلانا: xvfb-run -a -s "-screen 0 1366x768x24" python3 t22_native_probe.py
"""
import os, sys, json, time, subprocess, http.server, threading, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE + '/out/t22/keys/'
os.makedirs(OUT, exist_ok=True)
CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
LOG = []

PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>PROBE-%(n)s</title></head>
<body style="font:20px sans-serif;background:#eef"><h1>probe %(n)s</h1><textarea id="ta" style="width:900px;height:300px;font-size:20px"></textarea>
<script>
const N = %(nj)s;
const log = (ev, x) => { try { navigator.sendBeacon('/log', JSON.stringify({ p: N, ev, x: x || '' , t: Date.now() })); } catch (_) {} };
log('load');
document.addEventListener('visibilitychange', () => log('vis', document.visibilityState));
addEventListener('keydown', e => { log('key', (e.ctrlKey?'Ctrl+':'') + (e.altKey?'Alt+':'') + (e.shiftKey?'Shift+':'') + e.key); e.preventDefault(); }, true);
addEventListener('pagehide', () => log('pagehide'));
addEventListener('beforeunload', e => { log('beforeunload'); if (%(guard)s) { e.preventDefault(); e.returnValue = ''; } });
</script></body></html>"""


class Q(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        name = self.path.strip('/').split('?')[0] or 'x'
        guard = 'true' if name.startswith('G') else 'false'
        b = (PAGE % {'n': name, 'nj': json.dumps(name), 'guard': guard}).encode('utf-8')
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_POST(self):
        n = int(self.headers.get('Content-Length') or 0); body = self.rfile.read(n).decode('utf-8', 'replace')
        try: LOG.append(json.loads(body))
        except Exception: LOG.append({'raw': body})
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass


def sh(*a, **k):
    return subprocess.run(list(a), capture_output=True, text=True, **k).stdout


def shot(name):
    subprocess.run(['import', '-window', 'root', OUT + name + '.png'], check=False)


def chrome(prof, *urls, app=None):
    shutil.rmtree(prof, ignore_errors=True)
    args = [CHROME, '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--disable-gpu',
            '--password-store=basic', '--no-sandbox', '--test-type', '--window-size=1366,768', '--window-position=0,0', '--disable-features=Translate']
    if app: args.append('--app=' + app)
    args += list(urls)
    return subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_title(part, t=15):
    for _ in range(int(t * 10)):
        if part in sh('wmctrl', '-l'): return True
        time.sleep(0.1)
    return False


def focus_click(part):
    wid = sh('xdotool', 'search', '--name', part).split()
    if wid:
        subprocess.run(['xdotool', 'windowactivate', '--sync', wid[-1]], capture_output=True)
    subprocess.run(['xdotool', 'mousemove', '400', '300', 'click', '1']); time.sleep(0.3)


def events(p, since):
    return [e for e in LOG if e.get('p') == p and e.get('t', 0) >= since]


def main():
    wm = subprocess.Popen(['openbox'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.0)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Q); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{port}/'
    res = {'chromium': sh(CHROME, '--version').strip()}

    # ── 1) ٹیب بدلنے کی کلیدیں: ایک کھڑکی، دو ٹیبیں (A، B) — A سامنے ──
    pr = chrome('/tmp/t22p1', base + 'A', base + 'B'); wait_title('PROBE-'); time.sleep(2.5)
    rows = []
    for combo, label in [('ctrl+Tab', 'Ctrl+Tab'), ('ctrl+Next', 'Ctrl+PageDown'), ('ctrl+2', 'Ctrl+2'), ('ctrl+9', 'Ctrl+9'), ('ctrl+1', 'Ctrl+1'), ('alt+Left', 'Alt+Left')]:
        subprocess.run(['xdotool', 'key', '--clearmodifiers', 'ctrl+1']); time.sleep(0.6)   # A سامنے (اگر Ctrl+1 صفحہ روک لے تو بھی A پہلے سے سامنے)
        focus_click('PROBE-')
        t0 = int(time.time() * 1000)
        subprocess.run(['xdotool', 'key', '--clearmodifiers', combo]); time.sleep(1.0)
        ea = events('A', t0); eb = events('B', t0)
        keysA = [e['x'] for e in ea if e['ev'] == 'key' and not e['x'].endswith(('Control', 'Alt', 'Shift'))]
        r = {'key': label, 'page_A_received': keysA, 'B_became_visible': any(e['ev'] == 'vis' and e['x'] == 'visible' for e in eb),
             'title_now': [l.split(None, 3)[-1] for l in sh('wmctrl', '-l').splitlines()]}
        rows.append(r); print('1', json.dumps(r), flush=True)
        if r['B_became_visible']:
            subprocess.run(['xdotool', 'key', '--clearmodifiers', 'ctrl+shift+Tab']); time.sleep(0.6)
    res['tab_switch_keys'] = rows
    pr.terminate(); pr.wait(); time.sleep(1)

    # ── 2) کھڑکی کا X — عام ٹیب: (a) غیر محفوظ کام نہیں (b) غیر محفوظ کام (beforeunload) ──
    for name in ('N0', 'G1'):
        pr = chrome('/tmp/t22p2' + name, base + name); wait_title('PROBE-' + name); time.sleep(2.0)
        focus_click('PROBE-' + name); subprocess.run(['xdotool', 'type', '--delay', '60', 'unsaved text']); time.sleep(0.6)
        t0 = int(time.time() * 1000)
        subprocess.run(['wmctrl', '-c', 'PROBE-' + name]); time.sleep(2.0)
        shot('native_window_x_' + name)
        alive = pr.poll() is None
        r = {'window': 'Chrome tab', 'unsaved_work_guard': name == 'G1', 'chrome_process_alive': alive,
             'windows_after_X': [l.split(None, 3)[-1] for l in sh('wmctrl', '-l').splitlines()],
             'page_events': [e['ev'] for e in events(name, t0)]}
        res['window_x_' + name] = r; print('2', json.dumps(r, ensure_ascii=False), flush=True)
        pr.terminate();
        try: pr.wait(5)
        except Exception: pr.kill()
        time.sleep(1)

    # ── 3) کھڑکی کا X — ایپ کھڑکی (--app، انسٹال شدہ PWA کے قریب ترین)، غیر محفوظ کام کے ساتھ ──
    pr = chrome('/tmp/t22p3', app=base + 'GAPP'); wait_title('PROBE-GAPP'); time.sleep(2.0)
    focus_click('PROBE-GAPP'); subprocess.run(['xdotool', 'type', '--delay', '60', 'unsaved text']); time.sleep(0.6)
    t0 = int(time.time() * 1000)
    subprocess.run(['wmctrl', '-c', 'PROBE-GAPP']); time.sleep(2.0)
    shot('native_window_x_GAPP')
    r = {'window': 'app window (--app)', 'unsaved_work_guard': True, 'chrome_process_alive': pr.poll() is None,
         'windows_after_X': [l.split(None, 3)[-1] for l in sh('wmctrl', '-l').splitlines()],
         'page_events': [e['ev'] for e in events('GAPP', t0)]}
    res['window_x_GAPP'] = r; print('3', json.dumps(r, ensure_ascii=False), flush=True)
    pr.terminate()
    try: pr.wait(5)
    except Exception: pr.kill()

    # ── 4) ایپ کھڑکی میں Chrome کی محفوظ کلیدیں — کیا صفحہ پکڑ سکتا ہے؟ ──
    pr = chrome('/tmp/t22p4', app=base + 'APPK'); wait_title('PROBE-APPK'); time.sleep(2.0)
    rows = []
    for combo, label in [('ctrl+t', 'Ctrl+T'), ('ctrl+n', 'Ctrl+N'), ('ctrl+Tab', 'Ctrl+Tab'), ('ctrl+shift+t', 'Ctrl+Shift+T'), ('ctrl+Next', 'Ctrl+PageDown'), ('ctrl+w', 'Ctrl+W')]:
        focus_click('PROBE-APPK'); t0 = int(time.time() * 1000); w0 = sh('wmctrl', '-l')
        subprocess.run(['xdotool', 'key', '--clearmodifiers', combo]); time.sleep(1.2)
        ev = events('APPK', t0); w1 = sh('wmctrl', '-l')
        r = {'key': label, 'page_received': [e['x'] for e in ev if e['ev'] == 'key' and not e['x'].endswith(('Control', 'Shift'))],
             'windows_before': len(w0.splitlines()), 'windows_after': len(w1.splitlines()), 'app_window_open': 'PROBE-APPK' in w1}
        rows.append(r); print('4', json.dumps(r), flush=True)
        for l in w1.splitlines():
            if 'PROBE-APPK' not in l: subprocess.run(['wmctrl', '-i', '-c', l.split()[0]])
        time.sleep(0.5)
    res['app_window_keys'] = rows
    pr.terminate()
    try: pr.wait(5)
    except Exception: pr.kill()

    # ── 5) کھڑکی کا X — غیر محفوظ کا نشان ہے مگر افسر نے صفحے پر ابھی کچھ کلک / لکھا نہیں (user activation نہیں) ──
    pr = chrome('/tmp/t22p5', base + 'G5'); wait_title('PROBE-G5'); time.sleep(2.0)
    t0 = int(time.time() * 1000)
    subprocess.run(['wmctrl', '-c', 'PROBE-G5']); time.sleep(2.0)
    shot('native_window_x_G5_noactivation')
    r = {'window': 'Chrome tab', 'unsaved_work_guard': True, 'user_interacted': False, 'chrome_process_alive': pr.poll() is None,
         'windows_after_X': [l.split(None, 3)[-1] for l in sh('wmctrl', '-l').splitlines()], 'page_events': [e['ev'] for e in events('G5', t0)]}
    res['window_x_G5_noactivation'] = r; print('5', json.dumps(r, ensure_ascii=False), flush=True)
    pr.terminate()
    try: pr.wait(5)
    except Exception: pr.kill()

    srv.shutdown(); wm.terminate()
    json.dump(res, open(OUT + 'native.json', 'w'), ensure_ascii=False, indent=1)
    print('chromium', res['chromium'])


if __name__ == '__main__':
    main()
