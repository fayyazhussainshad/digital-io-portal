"""(TASK 22) عام Chrome ٹیب میں متبادل کلیدیں (Alt+T، Alt+W، Alt+PageDown …) — اصل X11 کی بورڈ، بغیر Playwright
چلانا: xvfb-run -a -s "-screen 0 1366x768x24" python3 t22_alt_probe.py"""
import json, time, subprocess, http.server, threading
import t22_native_probe as N
def main():
    wm = subprocess.Popen(['openbox'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.0)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), N.Q); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{port}/'
    pr = N.chrome('/tmp/t22p6', base + 'A', base + 'B'); N.wait_title('PROBE-'); time.sleep(2.5)
    rows = []
    for combo, label in [('alt+t', 'Alt+T'), ('alt+w', 'Alt+W'), ('alt+Next', 'Alt+PageDown'), ('alt+Prior', 'Alt+PageUp'),
                         ('ctrl+shift+Return', 'Ctrl+Shift+Enter'), ('alt+1', 'Alt+1'), ('alt+2', 'Alt+2'), ('ctrl+shift+Next', 'Ctrl+Shift+PageDown')]:
        subprocess.run(['xdotool', 'key', '--clearmodifiers', 'ctrl+1']); time.sleep(0.6)
        N.focus_click('PROBE-'); w0 = N.sh('wmctrl', '-l')
        t0 = int(time.time() * 1000)
        subprocess.run(['xdotool', 'key', '--clearmodifiers', combo]); time.sleep(1.0)
        ea = N.events('A', t0); eb = N.events('B', t0)
        r = {'key': label, 'page_received': [e['x'] for e in ea if e['ev'] == 'key' and not e['x'].endswith(('Control', 'Alt', 'Shift'))],
             'switched_tab': any(e['ev'] == 'vis' and e['x'] == 'visible' for e in eb), 'windows': len(N.sh('wmctrl', '-l').splitlines()), 'windows_before': len(w0.splitlines()),
             'title_now': [l.split(None, 3)[-1] for l in N.sh('wmctrl', '-l').splitlines()]}
        rows.append(r); print(json.dumps(r), flush=True)
        if r['switched_tab']: subprocess.run(['xdotool', 'key', '--clearmodifiers', 'ctrl+shift+Tab']); time.sleep(0.5)
    pr.terminate()
    try: pr.wait(5)
    except Exception: pr.kill()
    srv.shutdown(); wm.terminate()
    json.dump(rows, open(N.OUT + 'alt.json', 'w'), indent=1)
if __name__ == '__main__': main()
